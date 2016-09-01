(function(){
  /*
   * The magic happens in runGameFrame()
  */
  function SnakeGame() {
    var timePerFrame = 0;
    var gameOn = undefined;
    var gameIsOn = false;
    var canvas = document.getElementById("snake");
    var ctx = canvas.getContext("2d");
    var start = undefined;
    var apple = {
      "radius" : 5,
      "resetLocation" : function() {
        this.x = Math.floor(Math.random() * canvas.width);
        this.y = Math.floor(Math.random() * canvas.height);
        // Don't allow any part of apple to load offscreen
        if (this.x < this.radius) {
          this.x += this.radius;
        } else if (this.x > (canvas.width - this.radius)) {
          this.x -= this.radius;
        } else if (this.y < this.radius) {
          this.y += this.radius;
        } else if (this.y > (canvas.height - this.radius)) {
          this.y -= this.radius;
        }
      },
      "drawAt" : function(x, y) {
        ctx.moveTo(x + this.radius, y);
        ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();
      }
    };
    var snake = {
      "getLength" : function() {
        var actualLength = 0;
        var old = {
          "x" : this.tail.x,
          "y" : this.tail.y
        }
        this.body.forEach(function(obj) {
          actualLength += getDistance(old, obj);
          old.x = obj.x;
          old.y = obj.y;
        });
        return actualLength;
      },
      "tryToEat" : function(apple) {
        var snakeHead = {
          "x" : this.body[this.body.length - 1].x,
          "y" : this.body[this.body.length - 1].y,
        }
        if (
          snakeHead.x >= (apple.x - apple.radius) &&
          snakeHead.x <= (apple.x + apple.radius) &&
          snakeHead.y >= (apple.y - apple.radius) &&
          snakeHead.y <= (apple.y + apple.radius)
        ) {
          apple.resetLocation();
          return true;
        }
        return false;
      },
      "chopTailEnd" : function() {
        var tailEnd = this.body.shift();
        this.tail.x = tailEnd.x;
        this.tail.y = tailEnd.y;
      },
      "shrinkTail" : function() {
        if (this.body[0].direction === "up") {
          this.tail.y -= 1;
        } else if (this.body[0].direction === "right") {
          this.tail.x += 1;
        } else if (this.body[0].direction === "down") {
          this.tail.y += 1;
        } else { //Left
          this.tail.x -= 1;
        }
      },
      /**
       * Called each time snake moves if it does not
       * eat an apple.
       */
      "shrink" : function() {
        if (getDistance(this.tail, this.body[0]) > 1) {
          this.shrinkTail();
        } else {
          this.chopTailEnd();
        }
      },
      /**
       * After eating an apple, grow this.growLength - 1
       * Moving the snake grows it one pixel, so we don't need to grow the
       * full growLength.
       */
      "grow" : function() {
        var head = this.body[this.body.length - 1];
        if (head.direction === "up") {
          head.y -= (this.growLength - 1);
        } else if (head.direction === "right") {
          head.x += (this.growLength - 1);
        } else if (head.direction === "down") {
          head.y += (this.growLength - 1);
        } else { //Left
          head.x -= (this.growLength - 1);
        }
      },
      /**
       *  @param direction, e.g. "up", "right", "down", "left"
       *  @param x, e.g. -1
       *  @param y, e.g. 0
       */
      "move" : function(direction, x, y) {
        var headSegment = this.body[this.body.length - 1];
        if (headSegment.direction === direction) {
          headSegment.x = headSegment.x + x;
          headSegment.y = headSegment.y + y;
        } else {
          this.body.push(
            {
              "direction" : direction,
              "x" : headSegment.x + x,
              "y" : headSegment.y + y
            }
          );
        }
      },
      "hasCrashed" : function() {
        var snakeFrom = {
          "x" : this.tail.x,
          "y" : this.tail.y,
        };
        var head = {
          "x" : this.body[this.body.length - 1].x,
          "y" : this.body[this.body.length - 1].y
        };
        //If crashed into walls
        if (
          head.y < 0 ||
          head.x > canvas.width ||
          head.y > canvas.height ||
          head.x < 0
        ) {
          return true;
        } else {
          return this.body.some(function(snakeTo) {
            // Crashed into a horizontal segment of itself
            if (
              (
                (head.y === snakeTo.y)
                &&
                (head.x < snakeTo.x && head.x > snakeFrom.x)
              )
              ||
              // Crashed into a vertical segment of itself
              (
                (head.x === snakeTo.x)
                &&
                (head.y < snakeTo.y && head.y > snakeFrom.y)
              )
            ) {
              return true;
            } else {
              snakeFrom.x = snakeTo.x;
              snakeFrom.y = snakeTo.y;
            }
          });
        }
      },
      "draw" : function (isEatingApple) {
        var body_i;
        var headSegment = this.body[this.body.length - 1];
        ctx.beginPath();
        /*
          If the snake eats an apple and therefore keeps its tail,
          we don't need to refresh the entire view.
        */
        if (!isEatingApple) {
          ctx.clearRect(0,0, canvas.width, canvas.height);
          apple.drawAt(apple.x, apple.y);
          // drawing snake happens async, so apple must get drawn
          // here so as not to get cleared
          ctx.moveTo(this.tail.x, this.tail.y);
          for (body_i = 0; body_i < this.body.length; body_i++) {
            ctx.lineTo(this.body[body_i].x, this.body[body_i].y);
          }
        } else if (this.body.length > 1) {
          apple.drawAt(apple.x, apple.y);
          ctx.moveTo(this.body[this.body.length - 2].x, this.body[this.body.length - 2].y);
          ctx.lineTo(headSegment.x, headSegment.y);
        } else {
          apple.drawAt(apple.x, apple.y);
          ctx.moveTo(this.tail.x, this.tail.y);
          ctx.lineTo(headSegment.x, headSegment.y);
        }
        ctx.stroke();
      }
    };

    function initialize(input) {
      if (!document.querySelector("main").classList.contains("game")) {
        document.querySelector("main").classList.add("game");
        document.querySelector("main").appendChild(
          document.querySelector(".templates #snake")
        );
      }
      snake.growLength = 5;
      timePerFrame =
        input === undefined || input.timePerFrame === undefined
        ?
        10 : input.timePerFrame;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      start = {
        "x" : canvas.clientWidth / 2,
        "y" : canvas.clientHeight / 2
      }

      apple.eaten = false;
      apple.resetLocation();

      snake.direction = "right";
      snake.body = [{
        "direction" : "right",
        "x" : start.x + 50,
        "y" : start.y
      }];
      snake.tail = {
        "x" : start.x,
        "y" : start.y
      };

      ctx.strokeStyle = "white";
      window.addEventListener("keydown", catchUserEvents);
      togglePlayPause();
    }

    /**
     *  Gets distance between two points on a horizontal or
     *  vertical line.
     */
    function getDistance(loc1, loc2) {
      return Math.abs(loc2.x - loc1.x) + Math.abs(loc2.y - loc1.y);
    }

    function togglePlayPause() {
      if (gameIsOn) {
        window.clearInterval(gameOn);
        gameIsOn = false;
      } else {
        gameOn = window.setInterval(runGameFrame, timePerFrame);
        gameIsOn = true;
      }
    }

    function exitGame() {
      endGame();
      document.querySelector("main").classList.remove("game");
      document.querySelector(".templates").appendChild(
        document.querySelector("#snake")
      );
      window.SnakeGame.homepage.initialize();
    }


    function endGame() {
      gameIsOn = false;
      window.clearInterval(gameOn);
      window.removeEventListener("keydown", catchUserEvents);
    }

    function killSnake() {
      endGame();
      alert("Game over");
      initialize({"timePerFrame" : timePerFrame});
    }

    /*
     * Helps users by preventing "opposite" movements—
     * if the snake is going right, cannot hit the left arrow.
     */
    function catchUserEvents(e) {
      if (gameIsOn && (e.keyCode === 38 || e.which === 38)) {
        if (snake.direction !== "down") {
          snake.direction = "up";
        }
      } else if (gameIsOn && (e.keyCode === 39 || e.which === 39)) {
        if (snake.direction !== "left") {
          snake.direction = "right";
        }
      } else if (gameIsOn && (e.keyCode === 40 || e.which === 40)) {
        if (snake.direction !== "up") {
          snake.direction = "down";
        }
      } else if (gameIsOn && (e.keyCode === 37 || e.which === 37)) {
        if (snake.direction !== "right") {
          snake.direction = "left";
        }
      // Spacebar pauses game
      } else if (e.keyCode === 32 || e.which === 32) {
        togglePlayPause();
      } else if (e.keyCode === 27 || e.which === 27) {
        exitGame();
      }
    }

    function runGameFrame(e) {
      var ateApple = false;
      /*
       * Moving the snake grows it, whether or not it
       * has eaten an apple.
      */
      if (snake.direction === "up") {
        snake.move("up", 0, -1);
      } else if (snake.direction === "right") {
        snake.move("right", 1, 0);
      } else if (snake.direction === "down") {
        snake.move("down", 0, 1);
      } else { // "left"
        snake.move("left", -1, 0);
      }

      ateApple = snake.tryToEat(apple);
      /*
        If their new position is inside an apple
        they grow, so there's no need to shrink the tail.
      */
      if (!ateApple) {
        /*
          If they didn't eat an apple, we have to shrink the tail
          one frame length, given the move.
        */
        snake.shrink();
      } else {
        /*
         If they ate an apple, they have to grow
         snake.growLength - 1
        */
        snake.grow();
      }
      /*
        Draw snake given new coordinates, and apple
        Redraw entire snake if apple uneaten
      */
      snake.draw(ateApple);

      // If snake crashes into itself or end of board
      if (snake.hasCrashed()) {
        killSnake();
      }
    }

    return {
      "initialize" : initialize
    }
  }
  if (window.SnakeGame === undefined) {
    window.SnakeGame = {
      "player" : SnakeGame()
    };
  } else {
    window.SnakeGame.player = SnakeGame();
  }
}());