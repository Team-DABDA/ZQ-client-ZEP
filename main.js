const STATE_INIT = 3000;
const STATE_READY = 3001;
const STATE_PLAYING = 3002;
const STATE_JUDGE = 3004;
const STATE_END = 3005;

const TIME = 5;
const SCORE = 5;
const QUESTION = [
  // {
  //   type: true,
  //   content: "달팽이도 이빨이 있는가?",
  //   answer: "true",
  // },
  // {
  //   type: true,
  //   content: "딸기는 장미과에 속하는가??",
  //   answer: "true",
  // },
  // {
  //   type: true,
  //   content: "하마는 말의 일종인가?",
  //   answer: "true",
  // },
  // {
  //   type: false,
  //   content:
  //     "18세기 중엽 영국에서 시작된 기술혁신과 이에 수반하여 일어난 사회 · 경제 구조의 변혁을 무엇이라 할까요??",
  //   answer: "산업혁명",
  // },
  // {
  //   type: true,
  //   content:
  //     "미국 캘리포니아주 남서부 애너하임에 위치해 있는 세계적인 유원지이자, 대규모의 오락시설인 이곳은 어디일까요?",
  //   answer: "디즈니랜드",
  // },
];

let _state = STATE_INIT;
let _start = false;
let _stateTimer = 0;
let _timer = 90;
let _isKeyPressed = false;
let _currentWinner = "";
let _currentQuestion = "";
let _currentAnswer = "";
let _result = "";
let _players = App.players;
let _currentQuestionNumber = -1;

// App 실행 시에 최초로 호출되는 이벤트 (유저 진입 전)
// Normal App과 Sidebar App은 Script 적용 후 맵이 실행될 때 호출 [ Enter ]
App.onInit.Add(function(){
  App.sayToAll("------------------------------------------------")
  App.sayToAll("      🎉 Z:Q에 입장하신 것을 환영합니다! 🎉      ")
  App.sayToAll("------------------------------------------------")
});

// 플레이어 모두 진입 시 최초로 시작되는 이벤트 [ Enter ]
// 모든 플레이어가 onJoinPlayer를 통해 입장한 후 한 번 호출
App.onStart.Add(function(){
  App.sayToAll("------------------------------------------------")
  App.sayToAll("🧐 스피드 퀴즈 대결을 펼칠 퀴즈를 선택해주세요! 🧐")
  App.sayToAll("------------------------------------------------")

  widget = App.showWidget("widget.html", "top", 600, 500);

  // 게임 시작 위젯에서 메시지 보낸 경우
  widget.onMessage.Add(function (App, msg) {
    // 위젯에서 App으로 'type: close'라는 메시지를 보내면 위젯을 파괴함
    if (msg.type == "close") {
      widget.destroy();
      App.showCenterLabel("--- 문제 선택 종료 ---");
      // 앱 종료 시키기 함수
    } else if (msg.type == "start") {
      startGame(STATE_INIT);
      widget.destroy();
    }
  });

});

function startGame(state) {
  if (state != STATE_INIT) {
    return;
  }
  App.showCenterLabel("--- 게임이 곧 시작됩니다! ---");
  App.runLater(function () {
    App.showCenterLabel("--- [스피드 퀴즈 시작] : 답을 외치려면 shift키를 입력하세요! ---");
    _start = true;
    _state = STATE_READY;
    _currentQuestionNumber = 0;
  }, 3);
}

// 모든 플레이어를 이 이벤트를 통해 App에 진입시킴 [ Enter ]
// 이후 플레이어가 입장 할 때마다 호출 [ Events ]
// onInit이 호출된 후, 접속해 있는 모든 플레이어를 해당 이벤트를 통해 입장시키고, 이후 입장하는 플레이어가 있을 때 마다 동작합니다.
App.onJoinPlayer.Add(function (player) {

  App.showCenterLabel(`${player.name}님이 입장하셨습니다.`)

  player.tag = {
    score: 0,
  };
  player.sendUpdated();

  App.sayToAll(`${player.name}의 처음 점수는 ${player.tag.score}`)

});

// 20ms 마다 호출되는 이벤트
// dt: deltatime(전 프레임이 완료되기까지 걸린 시간) [ Update ]
App.onUpdate.Add(function (dt) {
  if (_currentQuestionNumber == QUESTION.length) {
    _state = STATE_END;
    return;
  }
  if (!_start) {
    return;
  }
  _stateTimer += dt;

  // const type = QUESTION[_currentQuestionNumber].type;
  _currentQuestion = QUESTION[_currentQuestionNumber].content;
  _currentAnswer = QUESTION[_currentQuestionNumber].answer;

  switch (_state) {
    case STATE_INIT:
      break;
    case STATE_READY:
      App.runLater(function () {
        App.showCenterLabel(`Q. ${_currentQuestion}`);
        _state = STATE_PLAYING;
        _timer = 90;
        _stateTimer = 0;
      }, 3);
      break;
    case STATE_PLAYING:
      if (_stateTimer >= 1) {
        _stateTimer = 0;
        _timer -= 1;
      }
      if (_timer <= 0) {
        App.showCenterLabel(`정답은 ${_currentAnswer}입니다!`);
        _state = STATE_JUDGE;
        _currentWinner = null;
      }
      // 유저가 버저 누르는경우 (shift)
      App.addOnKeyDown(16, function (player) {
        if (_isKeyPressed) {
          // 되면 누가 먼저 정답 외쳤다고 메시지 띄우기
          return;
        } else {
          _isKeyPressed = true;
          _currentSpeaker = pla
        }
        App.showCenterLabel(`${player.name} 님이 답변을 입력합니다.`);
        App.onSay.add(function (player, text) {
          if (_currentAnswer == text) {
            _currentWinner = player.name;
            player.tag.score += SCORE;
            _state = STATE_JUDGE;
            player.sendUpdated();
            App.sayToAll(`${player.name}의 현재 점수는 ${player.tag.score}`)
          } else {
            App.showCenterLabel("정답이 아닙니다!!");
          }
          _isKeyPressed = false;
          return;
        });
      });
      break;
    case STATE_JUDGE:
      if (_currentWinner != null) {
        App.showCenterLabel(`${_currentWinner} 님이 정답을 맞히셨습니다!`);
      } else {
        App.showCenterLabel(`아무도 정답을 맞히지 못했습니다. 이런!`);
      }
      _isKeyPressed = false;
      _state = STATE_READY;
      _currentQuestionNumber += 1;
      break;
    case STATE_END:
      winner = findFinalWinner();
      App.showCenterLabel(`🎉최종 우승자는 ${winner.join(" ")} 님입니다!🎉`);
      _start = false;
      break;
  }
});

function findFinalWinner() {
  var maxScore = 0;
  var winner = [];
  for (var player in _players) {
    if (player.tag.score > maxScore) {
      winner = [player.name];
    } else if (player.tag.score == maxScore) {
      winner.push(player.name);
    }
  }
  return winner;
}

function playGame(question) {
  const type = question.type;
  const content = question.content;
  const answer = question.answer;

  App.showCenterLabel(`Q. ${content}`);
}

// 이벤트 콜백 처리 후 다시 onUpdate

// App 종료 시 모든 플레이어를 App에서 나가게 함 [ Exit ]
// 퇴장하는 플레이어가 있을 때 마다 동작합니다. 이후, 다른 App이 실행되거나 설치한 Game Block이 파괴될 때 모든 플레이어를 이 함수를 통해 퇴장시킵니다.
App.onLeavePlayer.Add(function(player){
  App.showCenterLabel(`${player.name}님이 퇴장하셨습니다.`)
});

// App 종료 시 마지막으로 호출 [ Exit ]
// Normal App과 Sidebar App은 별도의 종료
// 다른 App이 실행되거나 설치한 Game Block이 파괴될 때 동작
App.onDestroy.Add(function(){
  App.showCenterLabel("--- 다음에 또 Z:Q에서 만나요! ---")
  App.sayToAll("------------------------------------------------")
  App.sayToAll("             👋🏻 Z:Q를 종료합니다! 👋🏻            ")
  App.sayToAll("------------------------------------------------")
});
