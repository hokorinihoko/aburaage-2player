//初期設定
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let W,H;
function resize(){
    W = canvas.width = window.innerWidth-20;
    H = canvas.height = window.innerHeight-20;
    //各画面の幅
    const WORLD_WIDTH = W;
}
window.addEventListener("resize",resize);
resize();
let startTime = Date.now();
let time = 0;
let gameOver = false;
let loser = "";
//プレイヤー
const players = [
{
    x:200,
    y:300,
    w:90,
    h:120,
    color:"gold",
    vx:0,
    vy:0,
    onGround:false,
    platform:null
},
{
    x:200,
    y:300,
    w:90,
    h:120,
    color:"blue",
    vx:0,
    vy:0,
    onGround:false,
    platform:null
}
];
//ワールド
const worlds = [
{
    cameraY:0,
    platformSpeed:1,
    platforms:[]
},
{
    cameraY:0,
    platformSpeed:1,
    platforms:[]
}
];
//プラットフォームの種類
const types = [
    "normal",
    "spring",
    "moving",
    "ice",
    "springmoving",
    "springice",
    "movingice"
];
//キー入力管理
const keys = {}; 
window.addEventListener("keydown", e => {
    keys[e.code] = true;
});
window.addEventListener("keyup", e => {
    keys[e.code] = false;
});
//描画
function render(){
    ctx.clearRect(0,0,W,H);
    // 左
    ctx.save();
    ctx.beginPath();
    ctx.rect(0,0,W/2,H);
    ctx.clip();
    drawGame(players[0], worlds[0]);
    ctx.restore();
    // 右
    ctx.save();
    ctx.beginPath();
    ctx.rect(W/2,0,W/2,H);
    ctx.clip();
    ctx.translate(W/2,0);
    drawGame(players[1], worlds[1]);
    ctx.restore();
    //分別線
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(W/2,0);
    ctx.lineTo(W/2,H);
    ctx.stroke();
}
//ゲーム描画
function drawGame(player,world){
    ctx.fillStyle = "#071021";
    ctx.fillRect(0,0,W/2,H);

    drawPlayer(player);
    //デバッグ情報
    if(1==1){
        ctx.fillStyle = "white";
        ctx.font = "16px sans-serif";
        ctx.fillText(
            "X:"+Math.floor(player.x),
            10,
            20
        );
        ctx.fillText(
            "Y:"+Math.floor(player.y),
            10,
            40
        );
        ctx.fillText(
            "Ground:" + player.onGround,
            10,
            60
        );
    }
    //タイマー
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds =
    Math.floor((elapsed % 60000) / 1000);
    const centiseconds =
    Math.floor((elapsed % 1000) / 10);
    const timeText =
    String(minutes).padStart(2,"0")
    + ":"
    + String(seconds).padStart(2,"0")
    + "."
    + String(centiseconds).padStart(2,"0");
    ctx.font = "24px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText(timeText,10,80);
    time=minutes*60+seconds+centiseconds/100;
    //プラットフォーム描画
    for(let p of world.platforms){
        const drawY = p.y - world.cameraY;
        switch(p.type){
            case "normal":
                ctx.fillStyle = "#00ffcc";
                break;
            case "spring":
                ctx.fillStyle = "#cc00ff";
                break;
            case "moving":
                ctx.fillStyle = "#00ccff";
                break;
            case "ice":
                ctx.fillStyle = "#00ffcc";
                break;
            case "springmoving":
                ctx.fillStyle = "#ccc0ff";
                break;
            case "springice":
                ctx.fillStyle = "#cc00ff";
                break;
            case "movingice":
                ctx.fillStyle = "#00ccff";
                break;
        }
        ctx.fillRect(
            p.x,
            drawY,
            p.w,
            p.h
        );
    }
}
//プレイヤー描画
function drawPlayer(player){
    //影
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(
        player.x,
        player.y + player.h/2 + 8,
        player.w*0.6,
        5,
        0,
        0,
        Math.PI*2
    );
    ctx.fill();
    // 本体
    ctx.fillStyle = player.color;
    ctx.fillRect(
        player.x-player.w/2,
        player.y-player.h/2,
        player.w,
        player.h
    );
}
//更新-プレイヤー
function updatePlayer(player, world){
    // 地面から離れる
    player.onGround = false;
    player.platform = null;
    // 重力
    player.vy += 0.5;
    // 移動
    player.y += player.vy;
    player.x += player.vx;
    // 壁判定
    if(player.x < player.w/2){
        player.x = player.w/2;
        player.vx = 0;
    }
    if(player.x > W/2 - player.w/2){
        player.x = W/2 - player.w/2;
        player.vx = 0;
    }
    // プラットフォーム判定
    for(let p of world.platforms){
        if( player.x + player.w/2 > p.x &&
            player.x - player.w/2 < p.x + p.w &&
            player.y + player.h/2 > p.y &&
            player.y - player.h/2 < p.y + 10 &&
            player.vy >= 0
        ){
            // プラットフォームとの衝突処理
            if(player.vy > 0 && player.y < p.y){
                player.y = p.y - player.h/2;
                player.vy = 0;
                player.onGround = true;
                player.platform = p;
                //跳ねる床
                if(
                    p.type === "spring" ||
                    p.type === "springmoving" ||
                    p.type === "springice"
                ){
                    player.vy = -20;
                }
            }
        }
    }
    // 速度制限
    if(player.vx > 8) player.vx = time/10+8;
    if(player.vx < -8) player.vx = -(time/10+8);
    // 摩擦
    let friction = 0.975;
    if(player.platform){
        if(
            player.platform.type === "ice" ||
            player.platform.type === "springice" ||
            player.platform.type === "movingice"
        ){
            friction = 0.995;
        }
    }
    player.vx *= friction;
    // 地面判定
    if(player.y > H-50){
        player.y = H-50;
        player.vy = 0;
        //跳ねる床
        if(
            player.platform &&
            (
                player.platform.type === "spring" ||
                player.platform.type === "springmoving" ||
                player.platform.type === "springice"
            )
        ){
            player.vy = -20;
        }
        player.onGround = true;
    }
    // プラットフォームと一緒に移動
    if(player.platform){
    player.y += world.platformSpeed;
    }
}
//更新-プレイヤー-呼び出し
function update(){
    updatePlayer(players[0], worlds[0]);
    updatePlayer(players[1], worlds[1]);
}
//更新-ワールド
function updateWorld(world){
    //プラットフォーム落下
    for(let p of world.platforms){
        world.platformSpeed =time/10+1;
        p.y += world.platformSpeed;
        // 移動するプラットフォームの移動
        if(
            p.type === "moving" ||
            p.type === "springmoving" ||
            p.type === "movingice"
        ){
        p.x += p.vx;
        if(p.x < 0){
            p.x = 0;
            p.vx *= -1;
        }
        if(p.x + p.w > W/2){
            p.x = W/2 - p.w;
            p.vx *= -1;
        }
        }
    }
}
//初期化
generatePlatforms(worlds[0]);
generatePlatforms(worlds[1]);
players[0].x = worlds[0].platforms[0].x + worlds[0].platforms[0].w/2;
players[0].y = worlds[0].platforms[0].y - players[0].h/2;
players[1].x = worlds[1].platforms[0].x + worlds[1].platforms[0].w/2;
players[1].y = worlds[1].platforms[0].y - players[1].h/2;
//キー入力
window.addEventListener("keydown",e=>{
    keys[e.code] = true;
});
window.addEventListener("keyup",e=>{
    keys[e.code] = false;
});
//プラットフォーム抽選
function randomPlatformType(){
    if(Math.random() < 0.9){
        return "normal";
    }
    const single = [
        "spring",
        "moving",
        "ice"
    ];
    const double = [
        "springmoving",
        "springice",
        "movingice"
    ];
    if(Math.random() < 0.2){
        return double[
            Math.floor(Math.random()*double.length)
        ];
    }
    return single[
        Math.floor(Math.random()*single.length)
    ];
}
//初期プラットフォーム生成
function generatePlatforms(world){
    world.platforms = [];
    // 最初の足場
    world.platforms.push({
        x: W/4 - 60,
        y: 150,
        w: 120,
        h: 20,
        type: "normal"
    });
    for(let i=0;i<20;i++){
        world.platforms.push({
            x:Math.random()*(W/2-120),
            y:H - i*250,
            w:240,
            h:20,
            type:randomPlatformType(),
            vx:(Math.random()<0.5?-2:2)
        });
    }
}
//ループ
function loop(){
    //ゲームオーバー判定
    if(players[0].y > H-100){
        winner = "2P";
        gameOver = true;
    }
    if(players[1].y > H-100){
        winner = "1P";
        gameOver = true;
    }
    if(gameOver){
        const elapsed = Date.now() - startTime;
        const minutes =
            Math.floor(elapsed / 60000);
        const seconds =
            Math.floor((elapsed % 60000) / 1000);
        const centiseconds =
            Math.floor((elapsed % 1000) / 10);
        const timeText =
            String(minutes).padStart(2,"0")
            + ":"
            + String(seconds).padStart(2,"0")
            + "."
            + String(centiseconds).padStart(2,"0");
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "80px sans-serif";
        ctx.fillText(
            "GAME OVER",
            W/2,
            H/2 - 50
        );
        ctx.font = "80px monospace";
        ctx.fillText(
            timeText,
            W/2,
            H/2 + 50
        );
        ctx.font = "120px sans-serif";
        ctx.fillText(
            winner + " WINS",
            W/2,
            H/2 + 150
        );
        ctx.font = "60px sans-serif";
        ctx.fillText(
            "もう一度プレイするには\nリロードしてください",
            W/2,
            H/2 + 200
        );
        return;
    }
    //更新
    update();
    updateWorld(worlds[0]);
    updateWorld(worlds[1]);
    for(let world of worlds){

        //古いプラットフォーム削除
        world.platforms =
        world.platforms.filter(
            p => p.y < H + 100
        );

        //新しいプラットフォーム生成
        while(world.platforms.length < 20){
            let topY = world.platforms[0].y;
            for(let p of world.platforms){
                if(p.y < topY){
                    topY = p.y;
                }
            }
            world.platforms.push({
                x:Math.random()*(W/2-240),
                y:topY - 250,
                w:240,
                h:20,
                type:randomPlatformType(),
                vx:(Math.random()<0.5?-2:2)
            });
        }
    }
    //プレイヤー操作
    if(keys["ArrowLeft"]){
        players[1].vx -= time/10+1;
    }
    if(keys["ArrowRight"]){
        players[1].vx += time/10+1;
    }
    if(keys["ArrowUp"] && players[1].onGround){
        players[1].vy = -15;
    }
    if(keys["KeyA"]){
        players[0].vx -= time/10+1;
    }
    if(keys["KeyD"]){
        players[0].vx += time/10+1;
    }
    if(keys["KeyW"] && players[0].onGround){
        players[0].vy = -15;
    }
    //描画
    render();
    requestAnimationFrame(loop);

}
loop();
