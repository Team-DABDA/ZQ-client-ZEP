const STATE_INIT = 3000;
const STATE_READY = 3001;
const STATE_PLAYING = 3002;
const STATE_JUDGE = 3004;
const STATE_END = 3005;

const TIME = 5;

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
let _currentQuestionNumber = 0;

let _questionId = "";
let QUESTION = [];
let SCORE = 5;

// App 실행 시에 최초로 호출되는 이벤트 (유저 진입 전)
// Normal App과 Sidebar App은 Script 적용 후 맵이 실행될 때 호출 [ Enter ]
App.onInit.Add(function () {
  App.sayToAll("------------------------------------------------");
  App.sayToAll("              🎉 Welcome to Z:Q! 🎉            ");
  App.sayToAll("------------------------------------------------");
});

// 플레이어 모두 진입 시 최초로 시작되는 이벤트 [ Enter ]
// 모든 플레이어가 onJoinPlayer를 통해 입장한 후 한 번 호출
App.onStart.Add(function () {
  App.sayToAll("------------------------------------------------");
  App.sayToAll("       🧐 Select quiz for speed game! 🧐       ");
  App.sayToAll("------------------------------------------------");

  widget = App.showWidget("widget.html", "top", 600, 500);

  // 게임 시작 위젯에서 메시지 보낸 경우
  widget.onMessage.Add(function (App, msg) {
    // 위젯에서 App으로 'type: close'라는 메시지를 보내면 위젯을 파괴함
    if (msg.type == "close") {
      widget.destroy();
      App.showCenterLabel("--- Quit quiz selecting ---");
      // 앱 종료 시키기 함수
    } else if (msg.type == "start") {
      _questionId = msg.id;
      loadQuestionData();
      // startGame(STATE_INIT);
      widget.destroy();
    }
  });
});

function loadQuestionData() {
  App.httpGet(
    `http://ec2-52-78-122-223.ap-northeast-2.compute.amazonaws.com/api/quiz/${_questionId}`,
    null,
    function (res) {
      // 응답 결과를 JSON 오브젝트로 변경
      let response = JSON.parse(res);
      QUESTION = response.quiz_question;
      SCORE = response.quiz_score;
      App.showCenterLabel(`--- [ There's total of ${QUESTION.length} questions. ] ---`);
      startGame(STATE_INIT);
    }
  );
}

function startGame(state) {
  if (state != STATE_INIT) {
    return;
  }
  App.showCenterLabel("--- Speed Quiz Game will start soon! ---");
  App.runLater(function () {
    App.showCenterLabel(
      "--- [ Speed Quiz Game Start ] : Click 'shift' button to answer the question! ---"
    );
    _start = true;
    _state = STATE_READY;
    _currentQuestionNumber = 0;
  }, 3);
}

// 모든 플레이어를 이 이벤트를 통해 App에 진입시킴 [ Enter ]
// 이후 플레이어가 입장 할 때마다 호출 [ Events ]
// onInit이 호출된 후, 접속해 있는 모든 플레이어를 해당 이벤트를 통해 입장시키고, 이후 입장하는 플레이어가 있을 때 마다 동작합니다.
App.onJoinPlayer.Add(function (player) {
  App.showCenterLabel(`--- [ ${player.name} entered Z:Q ] ---`);

  player.tag = {
    score: 0,
  };
  player.sendUpdated();

  
  App.sayToAll(`${player.name}의 처음 점수는 ${player.tag.score}`);
});

// 20ms 마다 호출되는 이벤트
// dt: deltatime(전 프레임이 완료되기까지 걸린 시간) [ Update ]
App.onUpdate.Add(function (dt) {
  if (_currentQuestionNumber == QUESTION.length) {
    _state = STATE_END;
  } else {
    _currenttype = QUESTION[_currentQuestionNumber].type;
    _currentQuestion = QUESTION[_currentQuestionNumber].content;
    _currentAnswer = QUESTION[_currentQuestionNumber].answer;
  }
  if (!_start) {
    return;
  }
  _stateTimer += dt;

  switch (_state) {
    case STATE_INIT:
      break;
    case STATE_READY:
      App.runLater(function () {
        App.showCenterLabel(`${type} : Q. ${_currentQuestion}`);
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
        App.showCenterLabel(`--- The answer is '${_currentAnswer}'! ---`);
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
          _currentSpeaker = player;
        }
        App.showCenterLabel(`--- [ ${player.name} has right to answer the question! ] ---`);
        App.onSay.add(function (player, text) {
          if (_currentAnswer == text) {
            _currentWinner = player.name;
            player.tag.score += SCORE;
            _state = STATE_JUDGE;
            player.sendUpdated();
            App.sayToAll(`${player.name}의 현재 점수는 ${player.tag.score}`);
          } else {
            App.showCenterLabel("--- [Wrong Answer] : Other person can try for the answeer! ---");
          }
          _isKeyPressed = false;
          return;
        });
      });
      break;
    case STATE_JUDGE:
      if (_currentWinner != null) {
        App.showCenterLabel(`--- [Right Answer] : Congretulation ${_currentWinner}! ---`);
      } else {
        App.showCenterLabel(`--- [Everyone Failed] : No one has got the right answer... Moving on to next question! ---`);
      }
      _isKeyPressed = false;
      _currentQuestionNumber += 1;
      if (_currentQuestionNumber == QUESTION.length) {
        _state = STATE_END;
      }
      App.sayToAll(`${_currentQuestionNumber}번째 문제입니다`);
      break;
    case STATE_END:
      // App.sayToAll(`끝으로~~!!`);
      winner = findFinalWinner();
      App.showCenterLabel(`--- 🎉최종 우승자는 ${winner} 님입니다!🎉 ---`);
      _start = false;
      initGame();
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
  App.sayToAll(`우승자${winner}}입니다`);
  return winner;
}

function initGame() {
  _start = false;
  _isGameOpened = false;
  _state = STATE_INIT;
  _timer = 20;
  _isKeyPressed = false;
  _currentSpeaker = null;
  _currentQuestion = null;
  _currentAnswer = null;
  _currentQuestionNumber = 0;
}

// 이벤트 콜백 처리 후 다시 onUpdate

// App 종료 시 모든 플레이어를 App에서 나가게 함 [ Exit ]
// 퇴장하는 플레이어가 있을 때 마다 동작합니다. 이후, 다른 App이 실행되거나 설치한 Game Block이 파괴될 때 모든 플레이어를 이 함수를 통해 퇴장시킵니다.
App.onLeavePlayer.Add(function (player) {
  App.showCenterLabel(`--- [ ${player.name} exited Z:Q ] ---`);
});

// App 종료 시 마지막으로 호출 [ Exit ]
// Normal App과 Sidebar App은 별도의 종료
// 다른 App이 실행되거나 설치한 Game Block이 파괴될 때 동작
App.onDestroy.Add(function () {
  App.showCenterLabel("--- See U again in Z:Q! ---");
  App.sayToAll("------------------------------------------------");
  App.sayToAll("          👋🏻 Closing Z:Q... Good Bye! 👋🏻        ");
  App.sayToAll("------------------------------------------------");
});
