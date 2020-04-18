/* globals Phaser */

var Breakout = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Breakout() {
    Phaser.Scene.call(this, { key: "breakout" });

    this.bricks;
    this.paddle;
    this.ball;
  },

  preload: function() {
    this.load.svg('lander', 'images/combined-lander.svg');
    this.load.svg('thrust', 'images/thrust.svg');

    this.load.atlas(
      "assets",
      "assets/games/breakout/breakout.png",
      "assets/games/breakout/breakout.json"
    );
  },

  create: function() {
    //  Enable world bounds, but disable the floor
    this.physics.world.setBoundsCollision(true, true, true, true);

    // debug text
    this.debugText = this.add.text(0, 0, 'Hello World', { fontFamily: 'Verdana, "Times New Roman", Tahoma, serif' });

    
    //  Create the bricks in a 10x6 grid
    this.bricks = this.physics.add.staticGroup({
      key: "assets",
      frame: ["blue1", "red1", "green1", "yellow1", "silver1", "purple1"],
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

    this.ball = this.physics.add
      .image(400, 500, "lander")
      .setCollideWorldBounds(true)
      .setBounce(0.5);
    this.ball.setGravityY(200);
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
    this.physics.add.collider(
      this.ball,
      this.paddle,
      this.hitPaddle,
      null,
      this
    );

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

    this.input.on(
      "pointerup",
      function(pointer) {
        if (this.ball.getData("onPaddle")) {
          this.ball.setVelocity(-75, -300);
          this.ball.setData("onPaddle", false);
        }
      },
      this
    );
  },

  hitBrick: function(ball, brick) {
    brick.disableBody(true, true);

    if (this.bricks.countActive() === 0) {
      this.resetLevel();
    }
  },

  resetBall: function() {
    this.ball.setVelocity(0);
    // this.ball.setPosition(this.paddle.x, 500);
    this.ball.setData("onPaddle", true);
  },

  resetLevel: function() {
    this.resetBall();

    this.bricks.children.each(function(brick) {
      brick.enableBody(false, 0, 0, true, true);
    });
  },

  hitPaddle: function(ball, paddle) {
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
  },

  update: function() {
    //console.log(this.ball.body.velocity.x);
    const cursorKeys = this.input.keyboard.createCursorKeys();
    const thrust = 700;
    const angleRate = 1.5;
    this.debugText.setText(`rotation ${this.ball.body.rotation.toFixed(1)} x: ${this.ball.body.x.toFixed(1)} y: ${this.ball.body.y.toFixed(1)}`)
    if (cursorKeys.up.isDown) {
      // this.ball.body.applyForce({x: 0, y:100});
      const rads = this.ball.body.rotation * Math.PI / 180;
      this.ball.body.acceleration.y = (-thrust) * Math.cos(rads);
      this.ball.body.acceleration.x = (thrust) * Math.sin(rads);
    } else {
      this.ball.body.acceleration.y = 0;
      this.ball.body.acceleration.x = 0;
    }
    
    if (cursorKeys.left.isDown) {
      this.ball.body.rotation -= angleRate;
    }

    if (cursorKeys.right.isDown) {
      this.ball.body.rotation += angleRate;
    }


    if (this.ball.y > 600) {
      this.resetBall();
    }
  }
});

var config = {
  type: Phaser.WEBGL,
  width: 800,
  height: 600,
  parent: "phaser-container",
  scene: [Breakout],
  physics: {
    default: "arcade"
  }
};

var game = new Phaser.Game(config);
