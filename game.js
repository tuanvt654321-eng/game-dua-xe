const canvas = document.getElementById('roadCanvas');
const ctx = canvas.getContext('2d');

// Tự động điều chỉnh kích thước Canvas chuẩn theo khung hiển thị
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();

// --- KHỞI TẠO BIẾN TRẠNG THÁI GAME ---
let score = 0;
let gameSpeed = 5; // Tốc độ nền của đường đua
let maxGameSpeed = 15;
let isGameOver = false;
let roadLinesY = 0; // Vị trí vạch kẻ đường để tạo hiệu ứng di chuyển

// Cấu trúc Xe của người chơi (Player)
let player = {
    x: 0,
    y: 0,
    width: 40,
    height: 70,
    speedX: 4,
    color: '#00bcd4' // Màu xanh lục bảo thời thượng
};

// Mảng chứa các xe cản đường (Obstacles)
let obstacles = [];
let spawnTimer = 0;

// Biến bắt sự kiện nút bấm điều khiển
let keys = { left: false, right: false, up: false, down: false };

// --- CÀI ĐẶT HỆ THỐNG ĐIỀU KHIỂN CẢM ỨNG TRÊN ĐIỆN THOẠI ---
function setupTouchEvents(btnId, keyProp) {
    const btn = document.getElementById(btnId);
    
    // Khi chạm ngón tay vào nút
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[keyProp] = true;
    });
    // Khi nhấc ngón tay ra khỏi nút
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys[keyProp] = false;
    });
}

setupTouchEvents('btnLeft', 'left');
setupTouchEvents('btnRight', 'right');
setupTouchEvents('btnUp', 'up');
setupTouchEvents('btnDown', 'down');

// Nút chơi lại khi thua
document.getElementById('btnRestart').addEventListener('click', () => {
    resetGame();
});

// --- HÀM KHỞI ĐỘNG / RESET LẠI GAME ---
function resetGame() {
    score = 0;
    gameSpeed = 5;
    isGameOver = false;
    obstacles = [];
    spawnTimer = 0;
    
    // Đặt xe người chơi ở giữa làn đường dưới cùng
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 20;
    
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('scoreVal').innerText = score;
    document.getElementById('speedVal').innerText = Math.round(gameSpeed * 15);
    
    resizeCanvas();
}

// --- HÀM TẠO XE CHƯỚNG NGẠI VẬT NGẪU NHIÊN ---
function spawnObstacle() {
    spawnTimer++;
    // Cứ sau một khoảng thời gian sẽ tạo 1 xe mới phía trên màn hình
    if (spawnTimer > 45) {
        let width = 40;
        let height = 70;
        // Giới hạn xe xuất hiện trong khu vực mặt đường lòng đường (bỏ lề đường)
        let roadLeftBound = 40;
        let roadRightBound = canvas.width - 40 - width;
        let x = Math.random() * (roadRightBound - roadLeftBound) + roadLeftBound;
        
        // Màu sắc ngẫu nhiên cho xe địch
        let colors = ['#f44336', '#e91e63', '#9c27b0', '#ff9800', '#ffeb3b'];
        let randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        obstacles.push({
            x: x,
            y: -height,
            width: width,
            height: height,
            color: randomColor,
            speedOffset: Math.random() * 2 // Tốc độ riêng biệt của từng xe cản
        });
        
        spawnTimer = 0;
    }
}

// --- HÀM KIỂM TRA VA CHẠM (TAI NẠN) ---
function checkCollision(rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y);
}

// --- HÀM VẼ ĐƯỜNG ĐUA VÀ HIỆU ỨNG DI CHUYỂN ---
function drawRoad() {
    // 1. Vẽ nhựa đường xám
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Vẽ lề đường hai bên (Hành lang cỏ/bảo hiểm)
    ctx.fillStyle = '#1b5e20'; // Màu xanh cỏ dại
    ctx.fillRect(0, 0, 30, canvas.height);
    ctx.fillRect(canvas.width - 30, 0, 30, canvas.height);
    
    // Vạch kẻ lề đường cố định màu trắng
    ctx.fillStyle = '#fff';
    ctx.fillRect(30, 0, 5, canvas.height);
    ctx.fillRect(canvas.width - 35, 0, 5, canvas.height);
    
    // 3. Vẽ vạch kẻ đứt chia làn đường di động
    ctx.save();
    roadLinesY += gameSpeed;
    if (roadLinesY >= 60) {
        roadLinesY = 0;
    }
    
    ctx.fillStyle = '#fff';
    // Chia làm 3 làn đường chính
    let lane1X = canvas.width / 3;
    let lane2X = (canvas.width / 3) * 2;
    
    for (let y = roadLinesY - 60; y < canvas.height; y += 60) {
        ctx.fillRect(lane1X - 2, y, 4, 30);
        ctx.fillRect(lane2X - 2, y, 4, 30);
    }
    ctx.restore();
}

// --- HÀM VẼ XE ĐẸP MẮT (DÙNG ĐỒ HỌA CANVAS THAY VÌ ẢNH TĨNH) ---
function drawCar(car, isPlayer) {
    ctx.save();
    ctx.fillStyle = car.color;
    
    // Vẽ thân xe chính (Thân bo tròn nhẹ góc)
    ctx.beginPath();
    ctx.roundRect(car.x, car.y, car.width, car.height, 8);
    ctx.fill();
    
    // Vẽ mui kính xe (Màu đen/Xám trong suốt)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(car.x + 5, car.y + (isPlayer ? 20 : 35), car.width - 10, 20);
    
    // Vẽ 4 bánh xe màu đen đặc
    ctx.fillStyle = '#111';
    ctx.fillRect(car.x - 3, car.y + 10, 3, 15);  // Bánh trước trái
    ctx.fillRect(car.x + car.width, car.y + 10, 3, 15); // Bánh trước phải
    ctx.fillRect(car.x - 3, car.y + car.height - 25, 3, 15); // Bánh sau trái
    ctx.fillRect(car.x + car.width, car.y + car.height - 25, 3, 15); // Bánh sau phải
    
    // Đèn pha trước (Màu vàng sáng)
    ctx.fillStyle = '#ffeb3b';
    if (isPlayer) {
        ctx.fillRect(car.x + 4, car.y, 6, 3);
        ctx.fillRect(car.x + car.width - 10, car.y, 6, 3);
    } else {
        ctx.fillRect(car.x + 4, car.y + car.height - 3, 6, 3);
        ctx.fillRect(car.x + car.width - 10, car.y + car.height - 3, 6, 3);
    }
    
    ctx.restore();
}

// --- VÒNG LẶP CẬP NHẬT CHÍNH (GAME LOOP) ---
function update() {
    if (isGameOver) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Vẽ nền đường đua trước
    drawRoad();
    
    // 2. Xử lý tăng/giảm tốc độ nền dựa vào nút bấm
    if (keys.up && gameSpeed < maxGameSpeed) {
        gameSpeed += 0.05;
    } else if (keys.down && gameSpeed > 2) {
        gameSpeed -= 0.1;
    } else if (!keys.up && gameSpeed > 5) {
        gameSpeed -= 0.02; // Tự động giảm tốc nhẹ khi nhả ga
    }
    
    // Cập nhật bảng tốc độ thực tế hiển thị
    document.getElementById('speedVal').innerText = Math.round(gameSpeed * 15);
    
    // 3. Xử lý di chuyển xe người chơi sang Trái/Phải
    if (keys.left && player.x > 35) {
        player.x -= player.speedX;
    }
    if (keys.right && player.x < canvas.width - 35 - player.width) {
        player.x += player.speedX;
    }
    
    // Vẽ xe người chơi
    drawCar(player, true);
    
    // 4. Xử lý và di chuyển xe địch
    spawnObstacle();
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        // Xe địch đi lùi xuống dưới màn hình dựa theo tốc độ đua
        obs.y += gameSpeed + obs.speedOffset;
        
        // Vẽ xe địch
        drawCar(obs, false);
        
        // Kiểm tra nếu xe địch chạy vượt qua đuôi xe mình an toàn -> Cộng điểm
        if (obs.y > canvas.height) {
            obstacles.splice(i, 1);
            score += 10;
            document.getElementById('scoreVal').innerText = score;
            continue;
        }
        
        // Kiểm tra va chạm tai nạn liên tục
        if (checkCollision(player, obs)) {
            isGameOver = true;
            document.getElementById('finalScore').innerText = score;
            document.getElementById('gameOverScreen').classList.remove('hidden');
        }
    }
    
    requestAnimationFrame(update);
}

// --- KÍCH HOẠT CHẠY GAME ---
window.onload = () => {
    resetGame();
    update();
};

// Đảm bảo game không bị lỗi hiển thị khi đổi chiều xoay điện thoại
window.addEventListener('resize', resizeCanvas);
