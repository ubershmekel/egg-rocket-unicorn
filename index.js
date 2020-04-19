/* globals Phaser */

let debug = false;

const musicUrl = "audio/music-sad-loop-reverb.mp3";
let musicStarted = false;

// Comment these out before shipping
// debug = true;
// musicStarted = true;

const defaultFontStyle = {
  fontFamily: 'Verdana, "Times New Roman", Tahoma, serif',
  fontSize: '20px',
}

const colors = {
  skyDay: Phaser.Display.Color.HexStringToColor("#6af"),
  skyLate: Phaser.Display.Color.HexStringToColor("#369"),
  skyNight: Phaser.Display.Color.HexStringToColor("#024"),
}

const softKeys = {};

///////////////////////////////////////////////
// Scene
///////////////////////////////////////////////
class MenuScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'menu',
    });
  }

  preload() {
    this.load.svg('tree', 'images/tree.svg');
    this.load.svg('egg', 'images/egg.svg');
    this.load.svg('robot', 'images/robot.svg');
    this.load.svg('big-robot', 'images/big-robot.svg');
    this.load.image('vertical-speed-particle', 'images/vertical-speed-particle.png');
    this.load.svg('thrust', 'images/thrust.svg');

    globalPreload(this);
  }

  async create() {
    globalCreate(this);
    fadeInPromise(this, 1000, true);

    this.phase = 'waiting';
    
    this.titleText = this.add.text(10, 300, 'Egg Rocket Unicorn', defaultFontStyle);
    this.instructionsText = this.add.text(10, 400, 'Use WASD or arrow keys', defaultFontStyle);
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
      this.game.scale.width, 0
    );
    // this.roboBackground.lineWidth = 10;
    this.roboBackground.setStrokeStyle(10, 0x000000);
    this.roboBackground.setFillStyle(0xffffff);

    this.bigRobot = this.add.image(670, 470, 'big-robot');
    this.bigRobot.rotation = -Math.PI / 5;

    this.roboBackground.visible = false;
    this.bigRobot.visible = false;

  }

  update() {
    const activeKeys = getActiveKeys(this.input.keyboard);
    if (this.phase === 'waiting') {
      if (activeKeys.up || activeKeys.left || activeKeys.right) {
        console.log("Egg dropping :(");
        this.phase = 'drop-egg';
        this.dropEgg();
      }

      // this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#6af");
      const skyPhase = (Math.cos(this.time.now * 0.001) + 1) * 5;
      const rgbColor = Phaser.Display.Color.Interpolate.ColorWithColor(colors.skyDay, colors.skyLate, 10, skyPhase);
      // console.log(skyPhase, rgbColor);
      this.cameras.main.setBackgroundColor(rgbColor);
    }

    if (this.controlRobot) {
      handleLanderControls(this);

      const overlap = rectOverlap(this.robot.getBounds(), this.egg.getBounds());
      // console.log("inter area", overlap);
      if (overlap > 0.5) {
        // Done with this scene, the egg was united with the robot.
        fadeOutToScene(this, 'get-warm');
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
    });
    
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
    this.tweens.timeline({
      tweens: [
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
      ]
    });
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
class GetWarmScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'get-warm',
    });
  }

  preload() {
    // this.load.svg('tree', 'images/tree.svg');
    // this.load.svg('egg', 'images/egg.svg');
    // this.load.svg('robot', 'images/robot.svg');
    // this.load.svg('big-robot', 'images/big-robot.svg');
    // this.load.image('vertical-speed-particle', 'images/vertical-speed-particle.png');

    this.load.svg('lander', 'images/combined-lander.svg');
    this.load.svg('thrust', 'images/thrust.svg');
    this.load.svg('tree-clump', 'images/tree-clump.svg');
    this.load.image('snowflake', 'images/snowflake.png');

    globalPreload(this);
  }

  // eslint-disable-next-line no-unused-vars
  onCollided(objA_, _objB) {
    // console.log('collided', objA, objB);
  }

  create() {
    globalCreate(this);
    fadeInPromise(this, 1000, true);

    createLanderPhysics(this, 'lander');

    this.warmSpot = this.add.image(720, 50, 'thrust');
    this.warmSpot.rotation = Math.PI;

    // Create obstacles
    this.walls = this.physics.add.group({
      immovable: true,
    });

    this.walls.create(0,   420, 'tree-clump');
    this.walls.create(150, 420, 'tree-clump');
    this.walls.create(300, 420, 'tree-clump');
    this.walls.create(450, 420, 'tree-clump');

    this.walls.create(250, 180, 'tree-clump');
    this.walls.create(400, 180, 'tree-clump');
    this.walls.create(550, 180, 'tree-clump');
    this.walls.create(700, 180, 'tree-clump');

    this.physics.add.collider(
      this.robot,
      this.walls,
      this.onCollided,
      null,
      this
    );

    // const passage = 200;
    // const thickness = 10;
    // this.block1 = this.add.rectangle(this.game.scale.width / 2, this.game.scale.height / 2, this.game.scale.width - passage, thickness, 0x996633).setStrokeStyle(4, 0x3f953f);
    // this.physics.add.existing(this.block1);
    // this.block1.body.setImmovable();
    //     this.physics.add.collider(
    //   this.robot,
    //   this.block1,
    //   this.onCollided,
    //   null,
    //   this
    // );

    // initial robot spot
    this.robot.x = 0;
    this.robot.y = this.game.scale.height - this.robot.height;

    // this.landerBase.setTint(0x9999ff);
    // this.landerBase.setTint(0xffffff);

    this.cameras.main.setBackgroundColor(colors.skyDay);

    const maxValue = 1000;
    this.tweens.addCounter({
      from: 0,
      to: maxValue,
      duration: 5000,
      onUpdate: (tween) => {
        const skyPhase = Math.floor(tween.getValue());
        const rgbColor = Phaser.Display.Color.Interpolate.ColorWithColor(colors.skyDay, colors.skyNight, maxValue, skyPhase);
        this.cameras.main.setBackgroundColor(rgbColor);
      }
    });

    const blue = Phaser.Display.Color.HexStringToColor('#6666ff');
    const regular = Phaser.Display.Color.HexStringToColor('#ffffff');
    this.tweens.addCounter({
      from: 0,
      to: maxValue,
      yoyo: true,
      repeat: -1,
      ease: "Quad.easeInOut",
      duration: 2000,
      onUpdate: (tween) => {
        const coldPhase = Math.floor(tween.getValue());
        const rgbColor = Phaser.Display.Color.Interpolate.ColorWithColor(regular, blue, maxValue, coldPhase);
        const hexColor = Phaser.Display.Color.ValueToColor(rgbColor).color;
        this.landerBase.setTint(hexColor);
      }
    });

    this.snowParticles();
  }

  snowParticles() {
    // Falling wind effect
    this.particles = this.add.particles('snowflake');
    this.emitter = this.particles.createEmitter({
      // frame: 'vertical-speed-particle',
      x: { min: 0, max: this.game.scale.width },
      y: { min: 0, max: this.game.scale.height },
      lifespan: 4000,
      speedX: { min: -2, max: 2 },
      speedY: { min: 0, max: 50 },
      // alpha: { start: 0, end: 1 },
      // alpha: { onEmit: function(particle, key, t, value) {
      //   console.log(t);
      //   return 1 - 2 * Math.abs(t - 0.5);;
      // }},
      scale: { start: 0.5, end: 0.3 },
      frequency: 311,
      blendMode: 'ADD'
    });
    this.emitter.setAlpha(function (particle, key, t) {
      // `t` is in the range of [0, 1], we lerp from 0 to 1 to 0.
      return 1 - 2 * Math.abs(t - 0.5);
    });
    

    // this.emitter.speedY = { min: -140, max: -590 };
    // this.emitter.visible = false;

    // put wind particles behind the tree
    this.particles.setDepth(-100);
    // this.emitter.on = false;
  }

  update() {
    // const skyPhase = (Math.cos(this.time.now * 0.0001) + 1) * 5;
    handleLanderControls(this);

    const overlap = rectOverlap(this.robot.getBounds(), this.warmSpot.getBounds());
    // console.log("inter area", overlap);
    if (overlap > 0.5) {
      // Done with this scene, the egg was united with the robot.
      // this.scene.start('eat');
      fadeOutToScene(this, 'eat');
    }

  }
}

///////////////////////////////////////////////
// Scene
///////////////////////////////////////////////
class EatRainbowsScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'eat',
    });
  }

  preload() {
    // this.load.image('lander', 'images/combined-lander.png');
    this.load.svg('robo-egg-unicorn', 'images/robo-egg-unicorn.svg');
    this.load.svg('thrust', 'images/thrust.svg');
    this.load.svg('rainbow', 'images/rainbow.svg');

    this.playChomp = soundLoader(this, ['audio/chomp1.mp3', 'audio/chomp2.mp3', 'audio/chomp3.mp3'], 0.5);

    globalPreload(this);
  }

  create() {
    globalCreate(this);
    fadeInPromise(this, 1000, true);

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
    createLanderPhysics(this, 'robo-egg-unicorn')

    //  Our colliders
    this.physics.add.collider(
      this.robot,
      this.bricks,
      this.hitBrick,
      null,
      this
    );

  }

  hitBrick(ball, brick) {
    brick.disableBody(true, true);
    this.playChomp();


    if (this.bricks.countActive() === 0) {
      fadeOutToScene(this, 'goodbye');
      // this.resetLevel();
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

  // hitPaddle(ball, paddle) {
    // var diff = 0;
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
  // }

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
// Scene
///////////////////////////////////////////////
class GoodbyeScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'goodbye',
    });

    this.timeInForestMs = 0;
  }
  
  preload() {
    globalPreload(this);

    this.load.svg('robot', 'images/robot.svg');
    // this.load.image('robot-family', 'images/robot-family.png');
    this.load.image('robot-family', 'images/robot-family.svg');
    this.load.image('forest-left', 'images/forest-left.svg');
    this.load.image('forest-left-clump', 'images/forest-left-clump.svg');
    this.load.svg('robo-egg-unicorn', 'images/robo-egg-unicorn.svg');
    this.load.svg('scene-goodbye', 'images/scene-goodbye.svg');
    this.load.svg('thrust', 'images/thrust.svg');
    this.load.spritesheet('unicorn', 'images/unicorn-walk-left.png', { frameWidth: 100, frameHeight: 100 });

  }

  create() {
    globalCreate(this);
    fadeInPromise(this, 1000, true);

    this.debugText = this.add.text(0, 0, 'Debug text', defaultFontStyle);
    this.debugText.setDepth(999);
    this.debugText.visible = debug;


    this.bg = this.add.image(this.game.scale.width / 2, this.game.scale.height / 2, 'scene-goodbye');

    this.add.image(this.game.scale.width * 0.91, this.game.scale.height * 0.7, 'robot-family');
    
    // messing with `setOrigin to make it easier to align with the unicorn
    this.forest1 = this.add.image(this.game.scale.width * 0.28, this.game.scale.height * 0.75, 'forest-left')
      .setOrigin(1, 1);

    this.unicorn = this.add.sprite(this.game.scale.width * 0.6, 400, 'unicorn');

    this.forest2 = this.add.image(this.game.scale.width * 0.25, this.game.scale.height * 0.75, 'forest-left-clump')
      .setOrigin(1, 0.5);

    this.allForestRect = Phaser.Geom.Rectangle.Union(this.forest1.getBounds(), this.forest2.getBounds());


    createLanderPhysics(this, 'robot');
    this.robot.x = this.game.scale.width * 0.5;
    this.robot.y = this.game.scale.height * 0.6;

    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('unicorn', { start: 1, end: 2 }),
      frameRate: 3,
      repeat: -1
    });

    this.tweens.add({
      targets: this.unicorn,
      x: "-=" + this.game.scale.width,
      duration: 46000,
    });
  }

  update(_timestamp, elapsedMs) {
    this.unicorn.anims.play('left', true);
    handleLanderControls(this);

    // Count if the robot chose to be with the unicorn
    const robotForestOverlap = rectOverlap(this.robot.getBounds(), this.allForestRect);
    if (robotForestOverlap > 0.8) {
      // this.debugText.text = "overlapping";
      this.timeInForestMs += elapsedMs;
    } else {
      // this.debugText.text = "nope";
      this.timeInForestMs = 0;
    }

    // notice when the unicorn leaves
    const unicornScreenOverlap = rectOverlap(this.bg.getBounds(), this.unicorn.getBounds());
    if (unicornScreenOverlap < 0.5) {
      // unicorn is about to exit, is the robot with it?
      if (this.timeInForestMs > 2000) {
        fadeOutToScene(this, 'friends-forever');
      } else {
        fadeOutToScene(this, 'no-more-unicorn');
      }
    }
    this.debugText.text = "" + unicornScreenOverlap;
  }
}

///////////////////////////////////////////////
// Scene
///////////////////////////////////////////////
class FriendsForeverScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'friends-forever',
    });

    this.timeInForestMs = 0;
  }
  
  preload() {
    globalPreload(this);
    this.load.image('scene-horse-robot-reunite', 'images/scene-horse-robot-reunite.svg');
  }

  create() {
    globalCreate(this);
    fadeInPromise(this, 1000, true);
    this.bg = this.add.image(this.game.scale.width / 2, this.game.scale.height / 2, 'scene-horse-robot-reunite');
  }
}


///////////////////////////////////////////////
// Scene
///////////////////////////////////////////////
class NoMoreUnicornScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'no-more-unicorn',
    });

    this.timeInForestMs = 0;
  }
  
  preload() {
    globalPreload(this);
    this.load.image('scene-robot-family-reunite', 'images/scene-robot-family-reunite.svg');
  }

  async create() {
    globalCreate(this);
    await fadeInPromise(this, 1000, true);
    this.bg = this.add.image(this.game.scale.width / 2, this.game.scale.height / 2, 'scene-robot-family-reunite');
    await sleep(3000);

    // slow fade out
    await fadeInPromise(this, 6000, false);
    // fadeOutToScene(this, 'menu');
    this.scene.start('menu');
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

let isFadeActive = false;
async function fadeOutToScene(scene, toSceneName) {
  if (isFadeActive) {
    console.log("Already fading out", toSceneName);
    return;
  }

  console.log("Fading out to scene", toSceneName);
  isFadeActive = true;
  await fadeInPromise(scene, 1000, false);
  scene.scene.start(toSceneName);
  isFadeActive = false;

}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fadeInPromise(scene, duration, isFadeIn) {
  const prom = new Promise((resolve, _reject) => {
    const progressCallback = (_cam, progress) => {
      if (progress > 0.99) {
        // done fading
        resolve();
      }
    };
    const red = 0, green = 0, blue = 0;
    if (isFadeIn) {
      scene.cameras.main.fadeIn(duration, red, green, blue, progressCallback);
    } else {
      scene.cameras.main.fadeOut(duration, red, green, blue, progressCallback);
    }
    
  });
  return prom;
}

function playMusic(scene) {
  if (musicStarted) {
    console.log("music already playing");
  } else {
    musicStarted = true;
    scene.sound.play(musicUrl, {
      volume: 0.5,
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
  scene.robot.body.setDrag(80, 80);
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

function globalPreload(scene) {
  scene.load.audio(musicUrl, musicUrl);
}

function globalCreate(scene) {
  playMusic(scene);

  if (isTouchScreen()) {
    createTouchButtons(scene);
  }
}

function isTouchScreen() {
  if ('ontouchstart' in document.documentElement) {
    return true;
  } else {
    return false;
  }
}

function createTouchButtons(scene) {
  const buttonWidth = 80;
  scene.leftButton = new Button({
    scene: scene,
    x: 0,
    y: scene.game.scale.height - 100,
    width: buttonWidth,
    height: 100,
    text: "⬅a",
    bgColor: 0xff0000,
    textColor: 0xffffff,
    onDown: () => softKeys.left = true,
    onUp: () => softKeys.left = false,
  })

  scene.rightButton = new Button({
    scene: scene,
    x: buttonWidth + 10,
    y: scene.game.scale.height - 100,
    width: buttonWidth,
    height: 100,
    text: "d➡",
    bgColor: 0xff0000,
    textColor: 0xffffff,
    onDown: () => softKeys.right = true,
    onUp: () => softKeys.right = false,
  })

  scene.upButton = new Button({
    scene: scene,
    x: scene.game.scale.width - buttonWidth,
    y: scene.game.scale.height - 100,
    width: buttonWidth,
    height: 100,
    text: "w⬆",
    bgColor: 0xff0000,
    textColor: 0xffffff,
    onDown: () => softKeys.up = true,
    onUp: () => softKeys.up = false,
  })
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

function rectOverlap(rectA, rectB) {
  // 0 = no overlap
  // % = intersection_area / min_rect_area
  // 1 = fully overlapping
  const intersectionRect = Phaser.Geom.Rectangle.Intersection(rectA, rectB);
  // The highest I got for `someOverlap` was 2000 when I was
  // looking at it.
  const minRectArea = Math.min(Phaser.Geom.Rectangle.Area(rectA), Phaser.Geom.Rectangle.Area(rectB));
  const intersectionArea = Phaser.Geom.Rectangle.Area(intersectionRect);
  return intersectionArea / minRectArea;
}

function isInFullScreen() {
  const document = window.document;
  return (
    (document.fullscreenElement && document.fullscreenElement !== null) ||
    (document.webkitFullscreenElement &&
      document.webkitFullscreenElement !== null) ||
    (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
    (document.msFullscreenElement && document.msFullscreenElement !== null)
  );
}

function requestFullScreen(elem) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullScreen) {
    elem.webkitRequestFullScreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  } else {
    console.warn("Did not find request full screen method", elem);
  }
}

function exitFullScreen() {
  const document = window.document;
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

// eslint-disable-next-line no-unused-vars
function toggleFullScreen(elem) {
  // based on https://stackoverflow.com/questions/36672561/how-to-exit-fullscreen-onclick-using-javascript
  if (isInFullScreen()) {
    exitFullScreen();
  } else {
    requestFullScreen(elem || document.body);
  }
}

const config = {
  // type: Phaser.WEBGL,
  width: 800,
  height: 600,
  parent: "phaser-container",
  scene: [
    GoodbyeScene,
    GetWarmScene,
    MenuScene,
    FriendsForeverScene,
    NoMoreUnicornScene,
    EatRainbowsScene,
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
    // Allow pressing more than one virtual button at a time
    activePointers: 4,
  }
};


// eslint-disable-next-line no-unused-vars
const _game = new Phaser.Game(config);