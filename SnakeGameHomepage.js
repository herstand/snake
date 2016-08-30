(function(){
  function SnakeGameHomepage() {

    function initialize() {
      drawHomepage();
      window.addEventListener("keydown", catchUserEvents);
      document.querySelector(".homepage .start").addEventListener("click", startGame);
    }

    function catchUserEvents(e) {
      if (
        (e.keyCode === 13 || e.which === 13) // Return
        ||
        (e.keyCode === 32 || e.which === 32) // Spacebar
      ) {
        startGame();
      }
    }

    function drawHomepage() {
      var main = document.querySelector("main");
      main.classList.add("homepage");
      main.appendChild(document.querySelector(".templates .homepageLayout"));
    }

    function hideHomepage() {
      document.querySelector(".templates").appendChild(
        document.querySelector(".homepageLayout")
      );
      document.querySelector("main").classList.remove("homepage");
    }

    function startGame() {
      window.removeEventListener("keydown", catchUserEvents);
      document.querySelector(".homepage .start").removeEventListener("click", startGame);
      hideHomepage();
      window.SnakeGame.player.initialize();
    }

    return {
      "initialize" : initialize
    }
  }
  if (window.SnakeGame === undefined) {
    window.SnakeGame = {
      "homepage" : SnakeGameHomepage()
    };
  } else {
    window.SnakeGame.homepage = SnakeGameHomepage();
  }
  window.SnakeGame.homepage.initialize();
}());