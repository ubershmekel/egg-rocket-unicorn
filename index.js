/* globals Phaser */

// const debug = true;
const debug = false;

const defaultFontStyle = {
  fontFamily: 'Verdana, "Times New Roman", Tahoma, serif',
  fontSize: '20px',
}

const colors = {
  skyDay: Phaser.Display.Color.HexStringToColor("#6af"),
  skyNight: Phaser.Display.Color.HexStringToColor("#369"),
}

const softKeys = {};

///////////////////////////////////////////////
// Scene
///////////////////////////////////////////////
class MenuScene extends Phaser.Scene {
  constructor() {
    super({
      key: "menu",
    });

    this.phase = 'waiting';
  }

  preload() {
    this.load.svg('tree', 'images/tree.svg');
    this.load.svg('egg', 'images/egg.svg');
    this.load.image('vertical-speed-particle', 'images/vertical-speed-particle.png');
  }

  create() {
    this.titleText = this.add.text(10, 10, 'Egg Rocket Unicorn', defaultFontStyle);
    this.instructionsText = this.add.text(10, 400, 'Use WASD or arrow keys', defaultFontStyle);
    this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#6af");
    this.tree = this.add.image(500, 700, 'tree');
    this.egg = this.add.image(450, 175, 'egg');
    this.egg.setDepth(-1);



    // tween.onComplete.add(this.startMatch, this);
    // this.animTreeUp = this.tweens.add({
    //   targetthis.tree).to( { x: 700, y: -600 }, 2000, "Quart.easeOut");
    // tweenB = this.add.tween(this.egg).to( { x: 400, y: 400 }, 2000, "Quart.easeOut");
    // this.animTreeUp.chain(tweenB);

    // game.input.onDown.addOnce(start, this);

  }

  update() {
    const activeKeys = getActiveKeys(this.input.keyboard);
    if (this.phase === 'waiting') {
      if (activeKeys.up || activeKeys.left || activeKeys.right) {
        // this.scene.start('game');
        // this.animTreeUp.start()
        console.log("Egg dropping :(");
        this.phase = 'drop-egg';
        this.dropEgg();
      }

      // this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#6af");
      const skyPhase = (Math.cos(this.time.now * 0.001) + 1) * 5;
      const hexColor = Phaser.Display.Color.Interpolate.ColorWithColor(colors.skyDay, colors.skyNight, 10, skyPhase);
      // console.log(skyPhase, hexColor);
      this.cameras.main.setBackgroundColor(hexColor);
    }
  }

  animTreeAway() {
    this.tweens.add({
      targets: [this.titleText, this.instructionsText],
      alpha: 0,
    })
    this.tweens.timeline({
      targets: this.tree,
      ease: 'Power1',
      duration: 13000,

      tweens: [
        {
          x: 600,
          y: -0,
          alpha: 0,
        },
      ]
    });
  }

  windParticles() {
    
    // Falling wind effect
    this.particles = this.add.particles('vertical-speed-particle');
    this.emitter = this.particles.createEmitter({
      // frame: 'vertical-speed-particle',
      x: { min: 0, max: this.game.scale.width },
      y: { min: 0, max: this.game.scale.height },
      lifespan: 1000,
      speedX: { min: -2, max: 2 },
      speedY: { min: -240, max: -790 },
      // speedY: { min: 0, max: 10 },
      alpha: { start: 0, end: 1 },
      scale: { start: 0.8, end: 0 },
      frequency: 31,
      blendMode: 'ADD'
    });

    // this.emitter.speedY = { min: -140, max: -590 };
    // this.emitter.visible = false;

    // put wind particles behind the tree
    this.particles.setDepth(-100);
    // this.emitter.on = false;
  }

  dropEgg() {
    this.tweens.timeline({ tweens: [
      {
        targets: this.egg,
        ease: 'Quad.easeIn',
        duration: 3000,
        rotation: -0.6,
        onComplete: () => {
          this.animTreeAway();
          this.windParticles();
        },
      },
      {
        targets: this.egg,
        ease: 'Power1',
        duration: 10000,
        rotation: -Math.PI * 2,
        x: this.game.scale.width / 2,
        y: this.game.scale.height / 4,
      },
      {
        targets: this.egg,
        ease: 'Linear',
        duration: 9000,
        rotation: -Math.PI * 2,
        repeat: 1,
      }
    ]});


  }
}

///////////////////////////////////////////////
// Scene
///////////////////////////////////////////////
class EggSaverScene extends Phaser.Scene {

  constructor(config) {
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
    this.createTouchButtons();

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
      key: "bla",
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
      function (pointer) {
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

  createTouchButtons() {
    const buttonWidth = 80;
    this.leftButton = new Button({
      scene: this,
      x: 0,
      y: this.game.scale.height - 100,
      width: buttonWidth,
      height: 100,
      text: "⬅a",
      bgColor: 0xff0000,
      textColor: 0xffffff,
      onDown: () => softKeys.left = true,
      onUp: () => softKeys.left = false,
    })

    this.rightButton = new Button({
      scene: this,
      x: buttonWidth + 10,
      y: this.game.scale.height - 100,
      width: buttonWidth,
      height: 100,
      text: "d➡",
      bgColor: 0xff0000,
      textColor: 0xffffff,
      onDown: () => softKeys.right = true,
      onUp: () => softKeys.right = false,
    })

    this.upButton = new Button({
      scene: this,
      x: this.game.scale.width - buttonWidth,
      y: this.game.scale.height - 100,
      width: buttonWidth,
      height: 100,
      text: "w⬆",
      bgColor: 0xff0000,
      textColor: 0xffffff,
      onDown: () => softKeys.up = true,
      onUp: () => softKeys.up = false,
    })
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

    this.bricks.children.each(function (brick) {
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


///////////////////////////////////////////////
// UI
///////////////////////////////////////////////
class Button extends Phaser.GameObjects.Rectangle {
  constructor({ scene, x, y, width, height, text, bgColor, textColor, onDown, onUp }) {
    super(scene, x, y);

    const padding = 10;

    scene.add.existing(this);
    this.setOrigin(0, 0);

    const style = { align: "center", fontSize: '30px' };
    this.label = scene.add.text(x + padding, y + padding, text, style)

    // const labelWidth = this.label.width + padding;
    // const labelHeight = this.label.height + padding;
    // this.width = labelWidth >= minimumWidth ? labelWidth : minimumWidth;
    // this.height = labelHeight >= minimumHeight ? labelHeight : minimumHeight;
    this.width = width;
    this.height = height;
    this.bgColor = bgColor;
    this.textColor = textColor;
    this.text = text;

    this.setInteractive({ useHandCursor: true })
      // .on('pointerover', this.enterMenuButtonHoverState)
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
    this.label.setColor(0x00ff00);
    this.setAlpha(0.5);
  }

  enterMenuButtonHoverState() {
    this.setFillStyle(0x888888);
  }

  enterMenuButtonRestState() {
    // this.label.setColor('#FFFFFF');
    this.setFillStyle(0xffffff);
  }

  enterMenuButtonActiveState() {
    // this.label.setColor('#BBBBBB');
    this.setFillStyle(0x444444);
  }
}

///////////////////////////////////////////////
// Functions
///////////////////////////////////////////////
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

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function soundLoader(scene, soundUrls, volume = 1.0) {
  for (const url of soundUrls) {
    const key = url;
    scene.load.audio(key, url);
  }
  function playRandom() {
    scene.sound.play(randomItem(soundUrls), { volume });
  }
  return playRandom;
}
var config = {
  // type: Phaser.WEBGL,
  width: 800,
  height: 600,
  parent: "phaser-container",
  scene: [
    MenuScene,
    EggSaverScene,
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
  input: {
    // Allow hitting more than one soft button at a time
    activePointers: 4,
  }
};

var game = new Phaser.Game(config);
