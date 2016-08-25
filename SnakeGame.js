(function(){
  /*
   * The magic happens in runGameFrame()
  */
  function SnakeGame() {
    var moveDistancePerFrame = 5; //CONST
    var timePerFrame = 50; //CONST
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
          this.allowedLength += moveDistancePerFrame;
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
          this.tail.y -= moveDistancePerFrame;
        } else if (this.body[0].direction === "right") {
          this.tail.x += moveDistancePerFrame;
        } else if (this.body[0].direction === "down") {
          this.tail.y += moveDistancePerFrame;
        } else { //Left
          this.tail.x -= moveDistancePerFrame;
        }
      },
      /**
       * Called when total snake length is one frame
       * greater than snake.allowedLength
       */
      "shrink" : function() {
        if (getDistance(this.tail, this.body[0]) > moveDistancePerFrame) {
          this.shrinkTail();
        } else {
          this.chopTailEnd();
        }
      },
      /**
       *  @param direction, e.g. "up", "right", "down", "left"
       *  @param x, e.g. -moveDistancePerFrame
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
                (head.y > snakeTo.y - moveDistancePerFrame)
                &&
                (head.y < snakeTo.y + moveDistancePerFrame)
                &&
                (head.x < snakeTo.x && head.x > snakeFrom.x)
              )
              ||
              // Crashed into a vertical segment of itself
              (
                (head.x > snakeTo.x - moveDistancePerFrame)
                &&
                (head.x < snakeTo.x + moveDistancePerFrame)
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

    function initializeGame() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      start = {
        "x" : canvas.clientWidth / 2,
        "y" : canvas.clientHeight / 2
      }

      apple.eaten = false;
      apple.resetLocation();

      snake.direction = "right";
      snake.allowedLength = moveDistancePerFrame;
      snake.body = [{
        "direction" : "right",
        "x" : start.x + moveDistancePerFrame,
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

    function togglePlayPause () {
      if (gameIsOn) {
        window.clearInterval(gameOn);
        gameIsOn = false;
      } else {
        gameOn = window.setInterval(runGameFrame, timePerFrame);
        gameIsOn = true;
      }
    }

    function endGame() {
      gameIsOn = false;
      window.clearInterval(gameOn);
      window.removeEventListener("keydown", catchUserEvents);
      alert("Game over");
      initializeGame();
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
      }
    }

    function runGameFrame(e) {
      var ateApple = false;
      /*
        Moving the snake extends it one frame length
        further than snake.allowedLength
      */
      if (snake.direction === "up") {
        snake.move("up", 0, -moveDistancePerFrame);
      } else if (snake.direction === "right") {
        snake.move("right", moveDistancePerFrame, 0);
      } else if (snake.direction === "down") {
        snake.move("down", 0, moveDistancePerFrame);
      } else { // "left"
        snake.move("left", -moveDistancePerFrame, 0);
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
      }
      /*
        Draw snake given new coordinates, and apple
        Redraw entire snake if apple uneaten
      */
      snake.draw(ateApple);

      // If snake crashes into itself or end of board
      if (snake.hasCrashed()) {
        endGame();
      }
    }

    return {
      "initializeGame" : initializeGame
    }
  }
  SnakeGame().initializeGame();
}());