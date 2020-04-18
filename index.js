/* globals Phaser */

// const debug = true;
const debug = false;

class Button extends Phaser.GameObjects.Rectangle {
  constructor({scene, x, y, width, height, text, bgColor, textColor, onDown, onUp}) {
    super(scene, x, y);

    const padding = 10;

    scene.add.existing(this);
    this.setOrigin(0, 0);

    this.label = scene.add.text(x + padding, y + padding, text).setFontSize(18).setAlign('center');

    // const labelWidth = this.label.width + padding;
    // const labelHeight = this.label.height + padding;
    // this.width = labelWidth >= minimumWidth ? labelWidth : minimumWidth;
    // this.height = labelHeight >= minimumHeight ? labelHeight : minimumHeight;
    this.width = width;
    this.height = height;
    this.bgColor = bgColor;
    this.textColor = textColor;

    this.setInteractive({ useHandCursor: true })
      .on('pointerover', this.enterMenuButtonHoverState)
      .on('pointerout', this.enterMenuButtonRestState)
      .on('pointerdown', this.enterMenuButtonActiveState)
      .on('pointerup', this.enterMenuButtonHoverState);

      if (onDown) {
        this.on('pointerdown', onDown);
      }
      if (onUp) {
        this.on('pointerup', onUp);
        this.on('pointerout', onUp)
      }
    
    this.enterMenuButtonRestState();
  }

  enterMenuButtonHoverState() {
    this.label.setColor('#000000');
    this.setFillStyle(0x888888);
  }

  enterMenuButtonRestState() {
    this.label.setColor('#FFFFFF');
    this.setFillStyle(0x008888);
  }

  enterMenuButtonActiveState() {
    this.label.setColor('#BBBBBB');
    this.setFillStyle(0x444444);
  }
}


function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function soundLoader(scene, soundUrls, volume=1.0) {
  for (const url of soundUrls) {
    const key = url;
    scene.load.audio(key, url);
  }
  function playRandom() {
    scene.sound.play(randomItem(soundUrls), { volume });
  }
  return playRandom;
}

class Menu extends Phaser.Scene {
  constructor () {
    super({
      key: "menu",
    });
  }

  create() {
    this.debugText = this.add.text(10, 10, 'Egg Rocket', { fontFamily: 'Verdana, "Times New Roman", Tahoma, serif' });
    this.add.text(10, 200, 'Use WASD or arrow keys', { fontFamily: 'Verdana, "Times New Roman", Tahoma, serif' });
    this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#6af");
  }

  update() {
    const activeKeys = getActiveKeys(this.input.keyboard);
    if (activeKeys.up || activeKeys.left || activeKeys.right) {
      this.scene.start('game');
    }
  }
}

const softKeys = {};

class EggSaver extends Phaser.Scene {

  constructor (config) {
    super({
      key: "game",
    });
  }

  preload() {
    this.load.svg('lander', 'images/combined-lander.svg');
    // this.load.image('lander', 'images/combined-lander.png');
    this.load.svg('thrust', 'images/thrust.svg');
    this.load.svg('rainbow', 'images/rainbow.svg');

    this.playChomp = soundLoader(this, ['audio/chomp1.mp3', 'audio/chomp2.mp3', 'audio/chomp3.mp3'], 0.2);

  }

  create() {
    this.leftButton = new Button({
      scene: this,
      x: 0,
      y: this.game.scale.height - 100,
      width: 50,
      height: 100,
      text: "⬅a",
      bgColor: 0xff0000,
      textColor: 0xffffff,
      onDown: () => softKeys.left = true,
      onUp: () => softKeys.left = false,
    })

    this.rightButton = new Button({
      scene: this,
      x: 60,
      y: this.game.scale.height - 100,
      width: 50,
      height: 100,
      text: "d➡",
      bgColor: 0xff0000,
      textColor: 0xffffff,
      onDown: () => softKeys.right = true,
      onUp: () => softKeys.right = false,
    })

    this.upButton = new Button({
      scene: this,
      x: this.game.scale.width - 50,
      y: this.game.scale.height - 100,
      width: 50,
      height: 100,
      text: "w⬆",
      bgColor: 0xff0000,
      textColor: 0xffffff,
      onDown: () => softKeys.up = true,
      onUp: () => softKeys.up = false,
    })

    //  Enable world bounds, but disable the floor
    this.physics.world.setBoundsCollision(true, true, true, true);

    // debug text
    this.debugText = this.add.text(0, 0, 'Debug text', { fontFamily: 'Verdana, "Times New Roman", Tahoma, serif' });
    this.debugText.visible = debug;
    
    // this.sky = this.add.Rectangle(0, 0, this.game.scale.width, this.game.scale.height);
    // this.sky.setFillStyle(0x0000ff);
    this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#6af");

    //  Create the bricks in a 10x6 grid
    this.bricks = this.physics.add.staticGroup({
      // key: "rainbow",
      frame: ["rainbow", "red1", "green1", "yellow1", "silver1", "purple1"],
      frameQuantity: 10,
      gridAlign: {
        width: 10,
        height: 6,
        cellWidth: 64,
        cellHeight: 32,
        x: 112,
        y: 100
      }
    });

    // Lander character
    
    // Thrust image
    this.thrust1 = this.add.sprite(0, 40, 'thrust');
    this.thrust1.visible = false;

    // Lander base
    const landerBase = this.add.image(0, 0, 'lander');
    // const thrust = this.add.image(0, 45, 'thrust');
    this.ball = this.add.container(300, 400, [this.thrust1, landerBase]);
    this.physics.world.enable(this.ball);

    // const radius = 230;
    // this.ball.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);
    this.ball.body.setSize(40, 70);
    this.ball.body.offset.x = -20;
    this.ball.body.offset.y = -30;

    // this.ball = this.physics.add.image(400, 400, "lander")
    this.ball.body.setCollideWorldBounds(true)
    this.ball.body.setBounce(0.5);
    // this.ball.body.setOrigin(0.5, 0.5);
    // this.ball.setScale(0.1, 0.1);
    // this.ball.setScale(4, 4);
    this.ball.body.setGravityY(200);
    this.ball.body.setDrag(10, 10);
    this.ball.setData("onPaddle", true);

    

    /*this.paddle = this.physics.add
      .image(400, 550, "assets", "paddle1")
      .setImmovable();*/


    //  Our colliders
    this.physics.add.collider(
      this.ball,
      this.bricks,
      this.hitBrick,
      null,
      this
    );
    // this.physics.add.collider(
    //   this.ball,
    //   this.paddle,
    //   this.hitPaddle,
    //   null,
    //   this
    // );

    //  Input events
    this.input.on(
      "pointermove",
      function(pointer) {
        //  Keep the paddle within the game
//         this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);

//         if (this.ball.getData("onPaddle")) {
//           this.ball.x = this.paddle.x;
//         }
      },
      this
    );

    // this.input.on(
    //   "pointerup",
    //   function(pointer) {
    //     if (this.ball.getData("onPaddle")) {
    //       // this.ball.setVelocity(-75, -300);
    //       this.ball.setData("onPaddle", false);
    //     }
    //   },
    //   this
    // );
  }

  hitBrick(ball, brick) {
    brick.disableBody(true, true);
    this.playChomp();

    if (this.bricks.countActive() === 0) {
      this.resetLevel();
    }
  }

  resetBall() {
    // this.ball.setVelocity(0);
    // this.ball.setPosition(this.paddle.x, 500);
    this.ball.setData("onPaddle", true);
  }

  resetLevel() {
    this.resetBall();

    this.bricks.children.each(function(brick) {
      brick.enableBody(false, 0, 0, true, true);
    });
  }

  hitPaddle(ball, paddle) {
    var diff = 0;

//     if (ball.x < paddle.x) {
//       //  Ball is on the left-hand side of the paddle
//       diff = paddle.x - ball.x;
//       ball.setVelocityX(-10 * diff);
//     } else if (ball.x > paddle.x) {
//       //  Ball is on the right-hand side of the paddle
//       diff = ball.x - paddle.x;
//       ball.setVelocityX(10 * diff);
//     } else {
//       //  Ball is perfectly in the middle
//       //  Add a little random X to stop it bouncing straight up!
//       ball.setVelocityX(2 + Math.random() * 8);
//     }
  }

  handleKeys() {
    const thrust = 700;
    const angleRate = 1.8;

    const keys = getActiveKeys(this.input.keyboard);
    if (keys.up) {
      // Thrust!
      this.thrust1.visible = true;
      // this.thrust1.x = this.ball.body.x;
      // this.thrust1.y = this.ball.body.y;
      
      // Apply thrust based on current rotation of egg
      const rads = this.ball.body.rotation * Math.PI / 180;
      this.ball.body.acceleration.y = (-thrust) * Math.cos(rads);
      this.ball.body.acceleration.x = (thrust) * Math.sin(rads);
    } else {
      this.thrust1.visible = false;
      this.ball.body.acceleration.y = 0;
      this.ball.body.acceleration.x = 0;
    }
    
    // Rotate the egg
    if (keys.left) {
      this.ball.body.rotation -= angleRate;
    }
    if (keys.right) {
      this.ball.body.rotation += angleRate;
    }
  }
  
  update() {
    //console.log(this.ball.body.velocity.x);
    
    this.debugText.setText(`rotation ${this.ball.body.rotation.toFixed(1)} x: ${this.ball.body.x.toFixed(1)} y: ${this.ball.body.y.toFixed(1)}`)

    this.handleKeys();


    if (this.ball.y > 600) {
      this.resetBall();
    }
  }
}

function getActiveKeys(keyboard) {
  const codes = Phaser.Input.Keyboard.KeyCodes;
  const cursorKeys = keyboard.createCursorKeys();
  const wasd = keyboard.addKeys({
    up: codes.W,
    down: codes.S,
    left: codes.A,
    right: codes.D,
  });

  return {
    up: cursorKeys.up.isDown || wasd.up.isDown || softKeys.up,
    left: cursorKeys.left.isDown || wasd.left.isDown || softKeys.left,
    right: cursorKeys.right.isDown || wasd.right.isDown || softKeys.right,
  }
}

var config = {
  // type: Phaser.WEBGL,
  width: 800,
  height: 600,
  parent: "phaser-container",
  scene: [
    EggSaver,
    Menu,
  ],
  physics: {
    default: "arcade",
    arcade: {
      debug,
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

var game = new Phaser.Game(config);
