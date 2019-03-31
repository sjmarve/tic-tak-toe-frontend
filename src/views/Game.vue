<template>
  <div class="game">

    <div class="flex flex-wrap bg-light text-center">
      <h4 class="p-4 text-center">
        <span v-if="game && game.result">{{game.result}}</span>
        <span v-else>{{result}}</span>
      </h4>
    </div>

    <div class="container bg-faded pt-2 text-center">
      <canvas ref="board" width="300" height="300"></canvas>
    </div>

    <div class="flex flex-wrap">
      <div class="w-1/5 mx-auto md:w-1/4  m-4 text-center">
        <button
          @click="resetBoard"
          type="button"
          class="mx-auto font-bold py-2 px-4 rounded">
          Reset Game
        </button>
      </div>
    </div>

    <div class="container mx-auto pt-2">
      <h5 v-if="game">Current Game: #{{game.id}}</h5>
      <hr>
      <h6>Stats</h6>
      <table class="table table-sm table-responsive">
        <tr>
          <td>X wins</td>
          <td>{{allGames.filter(v => v.result === 'x won').length}}</td>
        </tr>
        <tr>
          <td>O wins</td>
          <td>{{allGames.filter(v => v.result === 'o won').length}}</td>
        </tr>
        <tr>
          <td>Total Draws</td>
          <td>{{allGames.filter(v => v.result === 'draw').length}}</td>
        </tr>
        <tr>
          <td>Unfinished Games</td>
          <td>{{allGames.filter(v => !v.result).length}}</td>
        </tr>
      </table>

      <h1>Other Games</h1>
      <table class="table table-striped">
        <tr>
          <th>ID</th>
          <th>Last position</th>
          <th>Created At</th>
          <th>Result</th>
          <th>Action</th>
        </tr>
        <tr v-for="(game, index) in allGames" :key="index">
          <td>{{game.id}}</td>
          <td>{{game.last_position}}</td>
          <td>{{game.created_at}}</td>
          <td>{{game.result || '-'}}</td>
          <td>
            <button type="button" @click="loadGame(game)" class="btn btn-success btn-sm">Load Game</button>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
  import md5 from 'md5';
  export default {
    name: 'game',
    data(){
      return {
        game: null,
        board: null,
        nextMove: null,
        result: null,
        playing: null,
        allGames: [],
        api: process.env.VUE_APP_API_URL,
      };
    },
    mounted() {
      //create game identifier in local storage
      if (localStorage.getItem('group_identifier')) {
        this.group_identifier = JSON.parse(localStorage.getItem('group_identifier'));
      }else{
        localStorage.setItem('group_identifier', JSON.stringify(md5(new Date().getTime())));
      }

      this.board = '---------';
      this.initBoard();

      this.fetchGames();
    },
    methods: {
      resetBoard(){
        let canvas = this.$refs.board;
        let context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);
        var w = canvas.width;
        canvas.width = 1;
        canvas.width = w;

        this.game = null;
        this.board = '---------';
        this.result = null;
        this.playing = null;
        this.initBoard();

        this.fetchGames();
      },
      initBoard() {
        let canvas = this.$refs.board;
        canvas.addEventListener('click', (event) => {
          this.makeMove(event.clientX-canvas.offsetLeft, event.clientY-canvas.offsetTop);
        }, false);
        this.displayBoard();
        this.result = "Your move";
      },
      displayBoard(){
        let canvas = this.$refs.board;
        let context = canvas.getContext('2d');
        context.beginPath();

        context.moveTo(100,0);
        context.lineTo(100,300);

        context.moveTo(200,0);
        context.lineTo(200,300);

        context.moveTo(0,100);
        context.lineTo(300,100);

        context.moveTo(0,200);
        context.lineTo(300,200);

        context.stroke();

        for(let i=0;i<=8;i++) {
          switch(this.board.charAt(i)){
            case 'x':
              this.drawCross(context, Math.floor(i/3)*100 + 50, (i%3)*100 + 50);
              break;
            case 'o':
              this.drawNought(context, Math.floor(i/3)*100 + 50, (i%3)*100 + 50);
              break;
            default:
              break;
         }
        }
      },
      drawCross(context, x, y) {
        context.beginPath();
        context.moveTo(x-25, y-25);
        context.lineTo(x+25, y+25);
        context.moveTo(x+25, y-25);
        context.lineTo(x-25, y+25);
        context.stroke();
      },
      drawNought(context, x, y) {
        context.beginPath();
        context.arc(x,y,25,0,Math.PI*2,true);
        context.stroke();
      },
      makeMove(x, y) {
        let square = Math.floor(x/100)*3 + Math.floor(y/100) + 1;
        if(this.board === '---------'){
          this.startGame(square.toString());
        } else if (this.board.charAt(square-1) == '-') {
          this.submitGameUpdate(square.toString());
        }
      },
      startGame(square){
        this.$http.post(this.api + '/api/games', {
          group_identifier: this.group_identifier,
          position: this.board,
          square
        }).then((res) => {
          this.game = res.data.data;
          this.board = this.game.last_position;
          this.displayBoard();
        });
      },
      submitGameUpdate(square){
        this.$http.patch(this.api + '/api/games/'+this.game.id, {
          position: this.board,
          square
        }).then((res) => {
          this.game = res.data.data;
          this.board = this.game.last_position;
          if(this.game.result){
            this.playing = !this.playing;
          }
          this.displayBoard();
          if(this.game.result){
            this.fetchGames();
          }
        });
      },
      fetchGames(){
        this.$http.get(this.api + '/api/games', {
          params: {
            group_identifier: this.group_identifier,
          },
        }).then(res => {
          this.allGames = res.data.data;
        });
      },
      loadGame(game){
        let canvas = this.$refs.board;
        let context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);
        var w = canvas.width;
        canvas.width = 1;
        canvas.width = w;

        this.game = game;
        this.result = null;
        this.playing = null;
        this.board = game.last_position;
        this.initBoard();
        this.displayBoard();
        window.scrollTo(0, 0);
      }
    }
  }
</script>
