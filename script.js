const blockSize = 30;
const bgColor = "#fff";
const blockColor = "#000";
const fps = 60;
const can = document.getElementById("canvas");
const ctx = can.getContext("2d");
const arrowKeyCodes = [37, 38, 39, 40];
const playerSpeed = 30; // blocks per second
const bulletPerSecond = 5;
const bulletSpeed = 45;
let canHeight = canvas.height;
let canWidth = canvas.width;

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

document.addEventListener("keydown", fireOrMove);

class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

class Slab {
  constructor(x = 0, y = 0, w = 1, h = 1) {
    this.pos = new Vector2(x, y);
    this.size = new Vector2(w, h);
  }
  getRightPos() {
    return this.pos.x + this.size.x;
  }
  getBottomPos() {
    return this.pos.y + this.size.y;
  }

  slabTouchesLeft() {
    if (this.pos.x === 0) {
      return true;
    }
    return false;
  }
  slabTouchesRight() {
    if (this.getRightPos() === canWidth / blockSize) {
      return true;
    }
    return false;
  }
  slabTouchesBottom() {
    if (this.getBottomPos() === canHeight / blockSize) {
      return true;
    }
    return false;
  }
  slabTouchesTop() {
    if (this.pos.y === 0) {
      return true;
    }
    return false;
  }
  slabOutOfBounds() {
    if (
      this.pos.x < 0 ||
      this.pos.y < 0 ||
      this.getRightPos() > canWidth / blockSize ||
      this.getBottomPos() > canHeight / blockSize
    ) {
      return true;
    }
    return false;
  }
}

class Bullet extends Slab {
  constructor(pos, dir) {
    super(pos.x, pos.y, 1, 1);
    this.dir = dir;
  }

  move() {
    switch (this.dir) {
      case 37:
        this.pos.x--;
        break;
      case 38:
        this.pos.y--;
        break;
      case 39:
        this.pos.x++;
        break;
      case 40:
        this.pos.y++;
        break;
    }
  }

  moveInterval = setInterval(() => {
    this.move();
  }, 1000 / bulletSpeed);

  drawSelf() {
    drawBlockAt(this.pos.x, this.pos.y, 1, 1);
  }
}

class Tank extends Slab {
  constructor(x = 0, y = 0) {
    super(x, y, 3, 3);
    this.shape = [
      [1, 1, 0],
      [0, 1, 1],
      [1, 1, 0],
    ];
    this.dir = 39;
    this.bullets = [];
  }

  drawSelfAndBullet() {
    this.shape.forEach((row, m) => {
      row.forEach((elem, n) => {
        if (elem === 1) {
          drawBlockAt(this.pos.x + n, this.pos.y + m);
        }
      });
    });

    if (this.bullets.length != 0) {
      this.drawBullets();
    }
  }

  drawBullets() {
    this.bullets.forEach((bullet, i) => {
      drawBlockAt(bullet.pos.x, bullet.pos.y, 1, 1);
      if (bullet.slabOutOfBounds()) {
        this.bullets.splice(i, 1);
      }
    });
  }

  transposeShape() {
    this.shape.forEach((row, m) => {
      row.forEach((elem, n) => {
        if (m < n) {
          [this.shape[m][n], this.shape[n][m]] = [
            this.shape[n][m],
            this.shape[m][n],
          ];
        }
      });
    });
  }
  rotateClockwise() {
    this.transposeShape();
    this.shape.forEach((row) => {
      row.reverse();
    });
  }
  rotateCounterClockwise() {
    this.transposeShape();
    this.shape.reverse();
  }
  flip() {
    if (this.dir === 39 || this.dir === 37) {
      this.shape.forEach((row) => {
        row.reverse();
      });
    } else {
      this.shape.reverse();
    }
  }
  move(newDir) {
    switch (newDir) {
      case 37:
        if (!this.slabTouchesLeft()) {
          this.pos.x--;
        }
        break;
      case 38:
        if (!this.slabTouchesTop()) {
          this.pos.y--;
        }
        break;
      case 39:
        if (!this.slabTouchesRight()) {
          this.pos.x++;
        }
        break;
      case 40:
        if (!this.slabTouchesBottom()) {
          this.pos.y++;
        }
        break;
    }
  }
  rotate(newDir) {
    const dirDifference = newDir - this.dir;
    if (Math.abs(dirDifference) === 2) {
      this.flip();
    } else if (dirDifference === 1 || dirDifference === -3) {
      this.rotateClockwise();
    } else if (dirDifference === -1 || dirDifference === 3) {
      this.rotateCounterClockwise();
    }

    this.dir = newDir;
  }
  moveOrRotate(newDir) {
    if (this.dir === newDir) {
      this.move(newDir);
    } else {
      this.rotate(newDir);
    }
  }

  getBulletInitPos() {
    switch (this.dir) {
      case 37:
        return new Vector2(this.pos.x - 1, this.pos.y + 1);
        break;
      case 38:
        return new Vector2(this.pos.x + 1, this.pos.y - 1);
        break;
      case 39:
        return new Vector2(this.pos.x + 3, this.pos.y + 1);
        break;
      case 40:
        return new Vector2(this.pos.x + 1, this.pos.y + 3);
        break;
    }
  }

  fire() {
    this.bullets.push(new Bullet(this.getBulletInitPos(), this.dir));
  }
}

player = new Tank();

function throttle(fn, delay) {
  let lastTime = 0;
  return (...args) => {
    const now = new Date().getTime();
    if (now - lastTime < delay) {
      return;
    }
    lastTime = now;
    fn(...args);
  };
}
function fire() {
  player.fire();
}
throttledFire = throttle(fire, 1000 / bulletPerSecond);

function move(newDir) {
  player.moveOrRotate(newDir);
}
throttledMove = throttle(move, 1000 / playerSpeed);

function fireOrMove(e) {
  const pressedKey = e.keyCode;
  if (pressedKey === 32) {
    throttledFire();
  } else if (arrowKeyCodes.includes(e.keyCode)) {
    throttledMove(pressedKey);
  }
}
function drawBlockAt(x, y) {
  const borderWidth = 2;
  const padding = 1;
  const actualBlockSize = blockSize - padding * 2;
  const blockPos = { x: x * blockSize, y: y * blockSize };
  ctx.fillStyle = blockColor;
  ctx.fillRect(
    blockPos.x + padding,
    blockPos.y + padding,
    actualBlockSize,
    actualBlockSize
  );
  ctx.fillStyle = bgColor;
  ctx.fillRect(
    blockPos.x + borderWidth + padding,
    blockPos.y + borderWidth + padding,
    actualBlockSize - borderWidth * 2,
    actualBlockSize - borderWidth * 2
  );
  ctx.fillStyle = blockColor;
  ctx.fillRect(
    blockPos.x + padding + borderWidth * 2,
    blockPos.y + padding + borderWidth * 2,
    actualBlockSize - borderWidth * 4,
    actualBlockSize - borderWidth * 4
  );
}
function resizeCanvas() {
  const bodyHeight = document.body.clientHeight;
  const bodyWidth = document.body.clientWidth;
  canHeight = bodyHeight - (bodyHeight % blockSize);
  canWidth = bodyWidth - (bodyWidth % blockSize);
  canvas.height = canHeight;
  canvas.width = canWidth;
}
function fillWithBgColor() {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canWidth, canHeight);
}
function draw() {
  fillWithBgColor();
  player.drawSelfAndBullet();
}
draw();
function update() {}
setInterval(draw, 1000 / fps);
