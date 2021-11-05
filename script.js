const blockSize = 30;
const bgColor = "#fff";
const blockColor = "#000";
const fps = 60;
const can = document.getElementById("canvas");
const ctx = can.getContext("2d");
const arrowKeyCodes = [37, 38, 39, 40]; //must be in clockwise orders
const playerSpeed = 60; // blocks per second
const bulletSpeed = 30;
const bulletPerSecond = bulletSpeed;
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

  slabWillCollide(anotherSlab) {
    if (
      this.pos.x - anotherSlab.pos.x < anotherSlab.size.x &&
      this.pos.x - anotherSlab.pos.x > -this.size.x
    ) {
      if (
        this.pos.y - anotherSlab.pos.y < anotherSlab.size.y &&
        this.pos.y - anotherSlab.pos.y > -this.size.y
      ) {
        return true;
      }
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
  constructor(x = 0, y = 0, dir = 39) {
    super(x, y, 3, 3);
    this.shape =
      dir === 37
        ? [
            [0, 1, 1],
            [1, 1, 0],
            [0, 1, 1],
          ]
        : dir === 38
        ? [
            [0, 1, 0],
            [1, 1, 1],
            [1, 0, 1],
          ]
        : dir === 39
        ? [
            [1, 1, 0],
            [0, 1, 1],
            [1, 1, 0],
          ]
        : [
            [1, 0, 1],
            [1, 1, 1],
            [0, 1, 0],
          ];
    this.dir = dir;
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

    if (this.bullets.length > 0) {
      this.drawBullets();
      this.checkForBulletCollision();
    }
  }
  checkForBulletCollision() {
    if (this == player) {
      this.bullets.forEach((bullet) => {
        const self = bullet;
        enemies.forEach((enemy, i) => {
          if (bullet.slabWillCollide(enemy)) {
            this.bullets.splice(this.bullets.indexOf(bullet), 1);
            enemies.splice(enemies.indexOf(enemy), 1);
          }
        });
      });
    } else {
      this.bullets.forEach((bullet) => {
        const self = bullet;
        if (self.slabWillCollide(player)) {
          clearInterval(drawInterval);
        }
      });
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
    const indexOfDir = arrowKeyCodes.indexOf(this.dir);
    this.dir = arrowKeyCodes[(indexOfDir + 1 + arrowKeyCodes.length) % 4];
  }
  rotateCounterClockwise() {
    this.transposeShape();
    this.shape.reverse();
    const indexOfDir = arrowKeyCodes.indexOf(this.dir);
    this.dir = arrowKeyCodes[(indexOfDir - 1 + arrowKeyCodes.length) % 4];
  }
  flip() {
    if (this.dir === 39 || this.dir === 37) {
      this.shape.forEach((row) => {
        row.reverse();
      });
    } else {
      this.shape.reverse();
    }
    const indexOfDir = arrowKeyCodes.indexOf(this.dir);
    this.dir = arrowKeyCodes[(indexOfDir + 2 + arrowKeyCodes.length) % 4];
  }
  move(newDir) {
    const oldPos = new Vector2(this.pos.x, this.pos.y);
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
    if (this != player) {
      if (this.slabWillCollide(player)) {
        this.pos.x = oldPos.x;
        this.pos.y = oldPos.y;
        return false;
      }
    }

    if (this.collidedWithOtherEnemies(this)) {
      this.pos.x = oldPos.x;
      this.pos.y = oldPos.y;
      return false;
    }

    return true;
  }

  collidedWithOtherEnemies(self) {
    for (let i = 0; i < enemies.length; i++) {
      if (this == enemies[i]) {
        continue;
      }
      if (this.slabWillCollide(enemies[i])) {
        return true;
      }
    }
    return false;
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

class Enemy extends Tank {
  constructor(x, y, dir) {
    super(x, y, dir);
  }

  facingTheWall() {
    if (this.slabTouchesTop() && this.dir === 38) {
      return true;
    } else if (this.slabTouchesRight() && this.dir === 39) {
      return true;
    } else if (this.slabTouchesBottom() && this.dir === 40) {
      return true;
    } else if (this.slabTouchesLeft() && this.dir === 37) {
      return true;
    }
    return false;
  }
  makeAMove() {
    if (this.facingTheWall()) {
      this.flip();
      return;
    }

    if (Math.random() < 0.9) {
      if (!this.move(this.dir)) {
        if (Math.random() < 0.5) {
          this.rotateClockwise();
        } else {
          this.rotateCounterClockwise();
        }
      }
    }

    if (Math.random() < 0.5) {
      this.fire();
    }
  }
  moveEnemyInterval = setInterval(() => {
    this.makeAMove();
  }, 1000);
}
player = new Tank();
enemies = [];

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
function addEnemy() {
  const possiblePoses = {
    x: [0, canWidth / blockSize - 3],
    y: [0, canHeight / blockSize - 3],
  };

  const enemyPos = new Vector2(
    Math.random() < 0.5 ? possiblePoses.x[0] : possiblePoses.x[1],
    Math.random() < 0.5 ? possiblePoses.y[0] : possiblePoses.y[1]
  );
  const enemyDir =
    arrowKeyCodes[Math.floor(Math.random() * arrowKeyCodes.length)];
  const newEnemy = new Enemy(enemyPos.x, enemyPos.y, enemyDir);

  if (!onTopOfPlayer(newEnemy) && !onTopOfOtherEnemies(newEnemy)) {
    enemies.push(newEnemy);
  }
}
function onTopOfOtherEnemies(newEnemy) {
  let isOnTop = false;
  const otherEnemies = enemies.filter((enemy) => {
    if (enemy === newEnemy) {
      return false;
    }
    return true;
  });

  for (let i = 0; i < otherEnemies.length; i++) {
    if (onTopOfEachOther(otherEnemies[i], newEnemy)) {
      isOnTop = true;
      break;
    }
  }

  return isOnTop;
}

function onTopOfPlayer(newEnemy) {
  return onTopOfEachOther(player, newEnemy);
}

function onTopOfEachOther(tank1, tank2) {
  if (tank1.pos.x - tank2.pos.x < 3 && tank1.pos.x - tank2.pos.x > -3) {
    if (tank1.pos.y - tank2.pos.y < 3 && tank1.pos.y - tank2.pos.y > -3) {
      return true;
    }
  }

  return false;
}

function draw() {
  fillWithBgColor();
  player.drawSelfAndBullet();
  enemies.forEach((enemy) => {
    enemy.drawSelfAndBullet();
  });
}
addEnemyInterval = setInterval(addEnemy, 1000);
draw();
drawInterval = setInterval(draw, 1000 / fps);
