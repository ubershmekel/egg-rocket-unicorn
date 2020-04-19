/* globals Phaser */

let debug = false;
// debug = true;

const musicUrl = "audio/music-sad-loop-reverb.mp3";
let musicStarted = false;

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
  }

  preload() {
    this.load.svg('tree', 'images/tree.svg');
    this.load.svg('egg', 'images/egg.svg');
    this.load.svg('robot', 'images/robot.svg');
    this.load.svg('big-robot', 'images/big-robot.svg');
    this.load.image('vertical-speed-particle', 'images/vertical-speed-particle.png');
    this.load.svg('thrust', 'images/thrust.svg');

  }

  create() {
    this.phase = 'waiting';
    
    playMusic(this);

    this.titleText = this.add.text(10, 300, 'Egg Rocket Unicorn', defaultFontStyle);
    this.instructionsText = this.add.text(10, 500, 'Use WASD or arrow keys', defaultFontStyle);
    this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#6af");
    this.tree = this.add.image(500, 700, 'tree');
    this.egg = this.add.image(450, 175, 'egg');
    this.egg.setDepth(-1);

    // this.robot = this.add.image(370, 270, 'robot');
    // this.robot.scale = 0.5;

    createLanderPhysics(this, 'robot');
    this.robot.x = this.game.scale.width - 10;
    this.robot.y = this.game.scale.height - 10;
    this.robot.visible = false;
    this.controlRobot = false;

    // Uncomment to hack to get to end of this level faster
    // this.controlRobot = true;
    // this.robot.visible = true;

    this.roboBackground = this.add.triangle(
      500, 450,
      this.game.scale.width, this.game.scale.height,
      0, this.game.scale.height,
      this.game.scale.width, 0,
    );
    // this.roboBackground.lineWidth = 10;
    this.roboBackground.setStrokeStyle(10, 0x000000);
    this.roboBackground.setFillStyle(0xffffff);

    this.bigRobot = this.add.image(670, 470, 'big-robot');
    this.bigRobot.rotation = -Math.PI / 5;

    this.roboBackground.visible = false;
    this.bigRobot.visible = false;

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

    if (this.controlRobot) {
      handleLanderControls(this);

      // check for robot rescue
      const roboRect = this.robot.getBounds();
      const eggRect = this.egg.getBounds();
      const intersectionRect = Phaser.Geom.Rectangle.Intersection(roboRect, eggRect);
      // The highest I got for `someOverlap` was 2000 when I was
      // looking at it.
      const someOverlap = 1000;
      const intersectionArea = Phaser.Geom.Rectangle.Area(intersectionRect);
      // console.log("inter area", intersectionArea);
      if (intersectionArea > someOverlap) {
        // Done with this scene, the egg was united with the robot.
        this.scene.start('game');
      }
    }
  }

  animTreeAway() {
    this.tweens.add({
      targets: [this.titleText, this.instructionsText],
      alpha: 0,
      duration: 6000,
      // Note I can't assign `onComplete: this.showRobot` because that causes
      // `showRobot` to have an invalide `this` inside it.
      onComplete: () => this.showRobot(),
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
        duration: 2000,
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
        repeat: -1,
      }
    ]});
  }

  showRobot() {
    this.roboBackground.visible = true;
    this.bigRobot.visible = true;
    this.controlRobot = true;

    // Robot shaking in fear for the egg
    this.tweens.add({
      targets: this.bigRobot,
      x: '+= 3',
      y: '+= 4',
      duration: 250,
      repeat: -1,
      yoyo: true,
    });

    this.tweens.add({
      targets: [this.bigRobot, this.roboBackground],
      alpha: 0,
      delay: 3000,
      duration: 2000,
    });

    this.robot.visible = true;
  }
}

///////////////////////////////////////////////
// Scene
///////////////////////////////////////////////
class EatRainbowsScene extends Phaser.Scene {

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

    this.load.audio(musicUrl, musicUrl);
  }

  create() {
    playMusic(this);

    this.createTouchButtons();

    // debug text
    this.debugText = this.add.text(0, 0, 'Debug text', { fontFamily: 'Verdana, "Times New Roman", Tahoma, serif' });
    this.debugText.visible = debug;

    // this.sky = this.add.Rectangle(0, 0, this.game.scale.width, this.game.scale.height);
    // this.sky.setFillStyle(0x0000ff);
    this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#6af");

    //  Create the bricks in a 10x6 grid
    this.bricks = this.physics.add.staticGroup({
      key: "rainbow",
      // frame: ["rainbow", "red1", "green1", "yellow1", "silver1", "purple1"],
      frameQuantity: 60,
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
    //  Enable world bounds, but disable the floor
    this.physics.world.setBoundsCollision(true, true, true, true);
    createLanderPhysics(this, 'lander')
    

    //  Our colliders
    this.physics.add.collider(
      this.robot,
      this.bricks,
      this.hitBrick,
      null,
      this
    );

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
    
    this.scene.start('menu');

    if (this.bricks.countActive() === 0) {
      this.resetLevel();
    }
  }

  resetBall() {
    // this.ball.setVelocity(0);
    // this.ball.setPosition(this.paddle.x, 500);
    // this.ball.setData("onPaddle", true);
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

  update() {
    //console.log(this.ball.body.velocity.x);

    this.debugText.setText(`rotation ${this.robot.body.rotation.toFixed(1)} x: ${this.robot.body.x.toFixed(1)} y: ${this.robot.body.y.toFixed(1)}`)

    handleLanderControls(this);

    // if (this.ball.y > 600) {
    //   this.resetBall();
    // }
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

function playMusic(scene) {
  if (musicStarted) {
    console.log("music already playing");
  } else {
    musicStarted = true;
    scene.sound.play(musicUrl, {
      volume: 0.3,
      loop: true,
    });
  }
}

function createLanderPhysics(scene, landerImageName) {
  scene.physics.world.setBoundsCollision(true, true, true, true);

  // Lander base
  scene.landerBase = scene.add.image(0, 0, landerImageName);
  scene.landerBase.setDepth(1);

  // thrust image
  scene.thrust1 = scene.add.sprite(0, scene.landerBase.height / 2, 'thrust');
  scene.thrust1.visible = false;

  // Combined lander+thrust = robot
  scene.robot = scene.add.container(300, 400, [scene.thrust1, scene.landerBase]);

  scene.physics.world.enable(scene.robot);

  // const radius = 230;
  // this.ball.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);
  // scene.robot.body.setSize(40, 70);
  scene.robot.body.setSize(scene.landerBase.width, scene.landerBase.height);
  scene.robot.body.offset.x = -scene.landerBase.width / 2;
  scene.robot.body.offset.y = -scene.landerBase.height / 2;

  // scene.robot = this.physics.add.image(400, 400, "lander")
  scene.robot.body.setCollideWorldBounds(true)
  scene.robot.body.setBounce(0.5);
  // scene.robot.body.setOrigin(0.5, 0.5);
  // scene.robot.setScale(0.1, 0.1);
  // scene.robot.setScale(4, 4);
  scene.robot.body.setGravityY(200);
  scene.robot.body.setDrag(10, 10);
}

function handleLanderControls(scene) {
  const thrust = 700;
  const angleRate = 1.8;

  const keys = getActiveKeys(scene.input.keyboard);
  if (keys.up) {
    // Thrust!
    scene.thrust1.visible = true;
    // this.thrust1.x = this.ball.body.x;
    // this.thrust1.y = this.ball.body.y;

    // Apply thrust based on current rotation of egg
    const rads = scene.robot.body.rotation * Math.PI / 180;
    scene.robot.body.acceleration.y = (-thrust) * Math.cos(rads);
    scene.robot.body.acceleration.x = (thrust) * Math.sin(rads);
  } else {
    scene.thrust1.visible = false;
    scene.robot.body.acceleration.y = 0;
    scene.robot.body.acceleration.x = 0;
  }

  // Rotate the egg
  if (keys.left) {
    scene.robot.body.rotation -= angleRate;
  }
  if (keys.right) {
    scene.robot.body.rotation += angleRate;
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
    EatRainbowsScene,
    MenuScene,
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
