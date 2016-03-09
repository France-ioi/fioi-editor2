import 'bootstrap/css/bootstrap.min.css!';
import 'font-awesome/css/font-awesome.min.css!';

import angular from 'angular';
import 'angular-bootstrap';
import 'brace';
import 'brace/mode/c_cpp';
import 'brace/worker/javascript';
import 'fioi-editor2';
// import 'transloadit_xhr';

var app = angular.module('main', ['fioi-editor2', 'ui.bootstrap']);
var sourceLanguages = [
  {id: 'c', label: "C", ext: 'c', ace: {mode: 'c_cpp'}},
  {id: 'cpp', label: "C++", ext: 'cpp', ace: {mode: 'c_cpp'}},
  {id: 'pascal', label: "Pascal", ext: 'pas', ace: {mode: 'pascal'}},
  {id: 'ocaml', label: "OCaml", ext: 'ml', ace: {mode: 'ocaml'}},
  {id: 'java', label: "Java", ext: 'java', ace: {mode: 'java'}},
  {id: 'javascool', label: "JavaScool", ext: 'jvs', ace: {mode: 'java'}},
  {id: 'python2', label: "Python", ext: 'py', ace: {mode: 'python'}}
];
var testLanguages = [
  {id: 'text', label: 'Text', ext: 'txt', ace: {mode: 'text'}}
];

var sampleText = "#include \"lib.h\"\nconst int LARGEUR_MAX = 1000000;\nint destinationBille[LARGEUR_MAX+1];\nint main()\n{\n  for(int iPos = nbMarches() - 2; iPos >= 0; --iPos)\n  {\n    if(hauteur(iPos) < hauteur(iPos+1))\n      destinationBille[iPos] = iPos;\n    else\n      destinationBille[iPos] = destinationBille[iPos+1];\n  }\n  for(int iBille = 0; iBille < nbLancers(); ++iBille)\n  {\n    int posBille = marcheLancer(iBille);\n    positionFinale(destinationBille[posBille]);\n  }\n  return 0;\n}";
var sampleRecording = {"duration":33802,"events":[[0,"","0",{"tabsets":{"ts1":{"tabs":[{"id":"t3","dump":{"title":"Code1","buffers":[{"id":"b4","dump":{"text":"#include \"lib.h\"\nconst int LARGEUR_MAX = 1000000;\nint destinationBille[LARGEUR_MAX+1];\nint main()\n{\n  for(int iPos = nbMarches() - 2; iPos >= 0; --iPos)\n  {\n    if(hauteur(iPos) < hauteur(iPos+1))\n      destinationBille[iPos] = iPos;\n    else\n      destinationBille[iPos] = destinationBille[iPos+1];\n  }\n  for(int iBille = 0; iBille < nbLancers(); ++iBille)\n  {\n    int posBille = marcheLancer(iBille);\n    positionFinale(destinationBille[posBille]);\n  }\n  return 0;\n}","language":"cpp","selection":{"start":{"row":0,"column":0},"end":{"row":0,"column":0}}}}]}}],"activeTabId":"t3","name":"sources"},"ts2":{"tabs":[],"activeTabId":null,"name":"tests"}}}],[1000,"b4","c",1,0],[160,"b4","c",2,0],[149,"b4","c",3,0],[149,"b4","c",4,0],[152,"b4","c",5,0],[202,"b4","c",5,2],[374,"b4","c",5,3],[300,"b4","c",5,4],[263,"b4","c",5,5],[325,"b4","i",5,5,5,6," "],[0,"b4","c",5,6],[294,"b4","c",5,7],[156,"b4","c",5,10],[187,"b4","c",5,11],[240,"b4","s",5,11,5,11],[0,"b4","s",5,11,5,15],[206,"b4","d",5,11,5,15],[0,"b4","c",5,11],[0,"b4","s",5,11,5,11],[0,"b4","s",5,11,5,11],[0,"b4","i",5,11,5,12,"p"],[0,"b4","c",5,12],[67,"b4","i",5,12,5,13,"o"],[0,"b4","c",5,13],[87,"b4","i",5,13,5,14,"s"],[0,"b4","c",5,14],[237,"b4","s",5,14,5,14],[0,"b4","s",5,11,5,14],[574,"b4","c",5,14],[0,"b4","s",5,14,5,14],[0,"b4","s",5,14,5,14],[154,"b4","c",5,15],[146,"b4","c",5,17],[146,"b4","c",5,26],[146,"b4","c",5,28],[148,"b4","c",5,29],[141,"b4","c",5,31],[173,"b4","c",5,32],[223,"b4","c",5,34],[352,"b4","s",5,34,5,34],[0,"b4","s",5,34,5,38],[195,"b4","d",5,34,5,38],[0,"b4","c",5,34],[0,"b4","s",5,34,5,34],[0,"b4","s",5,34,5,34],[0,"b4","i",5,34,5,37,"pos"],[0,"b4","c",5,37],[237,"b4","c",5,38],[168,"b4","c",5,40],[168,"b4","c",5,41],[225,"b4","c",5,42],[276,"b4","c",5,46],[390,"b4","c",5,45],[175,"b4","c",5,44],[259,"b4","s",5,44,5,44],[0,"b4","s",5,44,5,46],[319,"b4","s",5,44,5,50],[333,"b4","d",5,44,5,50],[0,"b4","c",5,44],[0,"b4","s",5,44,5,44],[0,"b4","s",5,44,5,44],[0,"b4","i",5,44,5,47,"pos"],[0,"b4","c",5,47],[276,"b4","i",5,47,5,48," "],[0,"b4","c",5,48],[372,"b4","i",5,48,5,49,"-"],[0,"b4","c",5,49],[282,"b4","i",5,49,5,50,"="],[0,"b4","c",5,50],[102,"b4","i",5,50,5,51," "],[0,"b4","c",5,51],[185,"b4","i",5,51,5,52,"1"],[0,"b4","c",5,52],[297,"b4","c",6,3],[208,"b4","c",7,39],[18,"b4","c",7,4],[335,"b4","c",7,6],[376,"b4","i",7,6,7,7," "],[0,"b4","c",7,7],[237,"b4","c",7,8],[173,"b4","c",7,15],[165,"b4","c",7,16],[335,"b4","s",7,16,7,16],[0,"b4","s",7,16,7,20],[199,"b4","d",7,16,7,20],[0,"b4","c",7,16],[0,"b4","s",7,16,7,16],[0,"b4","s",7,16,7,16],[0,"b4","i",7,16,7,19,"pos"],[0,"b4","c",7,19],[289,"b4","c",7,22],[171,"b4","c",7,23],[160,"b4","c",7,30],[173,"b4","c",7,31],[324,"b4","s",7,31,7,31],[0,"b4","s",7,31,7,35],[189,"b4","d",7,31,7,35],[0,"b4","c",7,31],[0,"b4","s",7,31,7,31],[0,"b4","s",7,31,7,31],[0,"b4","i",7,31,7,34,"pos"],[0,"b4","c",7,34],[336,"b4","i",7,34,7,35," "],[0,"b4","c",7,35],[147,"b4","c",7,36],[115,"b4","i",7,36,7,37," "],[0,"b4","c",7,37],[205,"b4","c",8,36],[76,"b4","c",8,6],[258,"b4","c",8,22],[163,"b4","c",8,23],[384,"b4","s",8,23,8,23],[0,"b4","s",8,23,8,27],[206,"b4","d",8,23,8,27],[0,"b4","c",8,23],[0,"b4","s",8,23,8,23],[0,"b4","s",8,23,8,23],[0,"b4","i",8,23,8,26,"pos"],[0,"b4","c",8,26],[286,"b4","c",8,29],[194,"b4","c",8,30],[252,"b4","s",8,30,8,30],[0,"b4","s",8,30,8,34],[178,"b4","d",8,30,8,34],[0,"b4","c",8,30],[0,"b4","s",8,30,8,30],[0,"b4","s",8,30,8,30],[0,"b4","i",8,30,8,33,"pos"],[0,"b4","c",8,33],[235,"b4","c",9,8],[181,"b4","c",10,33],[61,"b4","c",10,6],[208,"b4","c",10,22],[176,"b4","c",10,23],[372,"b4","s",10,23,10,23],[0,"b4","s",10,23,10,27],[185,"b4","d",10,23,10,27],[0,"b4","c",10,23],[0,"b4","s",10,23,10,23],[0,"b4","s",10,23,10,23],[0,"b4","i",10,23,10,26,"pos"],[0,"b4","c",10,26],[194,"b4","c",10,29],[163,"b4","c",10,30],[173,"b4","c",10,46],[182,"b4","c",10,47],[354,"b4","s",10,47,10,47],[0,"b4","s",10,47,10,51],[397,"b4","d",10,47,10,51],[0,"b4","c",10,47],[0,"b4","s",10,47,10,47],[0,"b4","s",10,47,10,47],[0,"b4","i",10,47,10,50,"pos"],[0,"b4","c",10,50],[383,"b4","i",10,50,10,51," "],[0,"b4","c",10,51],[75,"b4","c",10,52],[112,"b4","i",10,52,10,53," "],[0,"b4","c",10,53],[226,"b4","c",11,3],[184,"b4","c",12,53],[88,"b4","c",12,2],[251,"b4","c",12,5],[156,"b4","c",12,6],[160,"b4","c",12,9],[287,"b4","c",12,10],[265,"b4","s",12,10,12,10],[0,"b4","s",12,10,12,16],[266,"b4","d",12,10,12,16],[0,"b4","c",12,10],[0,"b4","s",12,10,12,10],[0,"b4","s",12,10,12,10],[0,"b4","i",12,10,12,11,"b"],[0,"b4","c",12,11],[113,"b4","i",12,11,12,12,"i"],[0,"b4","c",12,12],[75,"b4","i",12,12,12,13,"l"],[0,"b4","c",12,13],[176,"b4","i",12,13,12,14,"l"],[0,"b4","c",12,14],[32,"b4","i",12,14,12,15,"e"],[0,"b4","c",12,15],[224,"b4","s",12,15,12,15],[0,"b4","s",12,10,12,15],[569,"b4","c",12,15],[0,"b4","s",12,15,12,15],[0,"b4","s",12,15,12,15],[159,"b4","c",12,16],[190,"b4","c",12,18],[168,"b4","c",12,19],[180,"b4","c",12,21],[470,"b4","s",12,21,12,21],[0,"b4","s",12,21,12,27],[151,"b4","d",12,21,12,27],[0,"b4","c",12,21],[0,"b4","s",12,21,12,21],[0,"b4","s",12,21,12,21],[0,"b4","i",12,21,12,26,"bille"],[0,"b4","c",12,26],[224,"b4","c",12,27],[163,"b4","c",12,29],[158,"b4","c",12,38],[163,"b4","c",12,41],[163,"b4","c",12,42],[292,"b4","c",12,44],[410,"b4","s",12,44,12,44],[0,"b4","s",12,42,12,44],[259,"b4","d",12,42,12,44],[0,"b4","s",12,42,12,42],[0,"b4","s",12,42,12,42],[298,"b4","s",12,42,12,42],[0,"b4","s",12,42,12,48],[189,"b4","d",12,42,12,48],[0,"b4","c",12,42],[0,"b4","s",12,42,12,42],[0,"b4","s",12,42,12,42],[0,"b4","i",12,42,12,47,"bille"],[0,"b4","c",12,47],[256,"b4","i",12,47,12,48," "],[0,"b4","c",12,48],[263,"b4","i",12,48,12,49,"+"],[0,"b4","c",12,49],[195,"b4","i",12,49,12,50,"="],[0,"b4","c",12,50],[94,"b4","i",12,50,12,51," "],[0,"b4","c",12,51],[78,"b4","i",12,51,12,52,"1"],[0,"b4","c",12,52],[305,"b4","c",13,3],[201,"b4","c",14,40],[68,"b4","c",14,4],[277,"b4","c",14,7],[149,"b4","c",14,8],[275,"b4","s",14,8,14,8],[0,"b4","s",14,8,14,16],[320,"b4","s",14,8,14,17],[0,"b4","s",14,17,14,17],[203,"b4","c",14,19],[163,"b4","c",14,31],[160,"b4","c",14,32],[318,"b4","s",14,32,14,32],[0,"b4","s",14,32,14,38],[211,"b4","d",14,32,14,38],[0,"b4","c",14,32],[0,"b4","s",14,32,14,32],[0,"b4","s",14,32,14,32],[0,"b4","i",14,32,14,37,"bille"],[0,"b4","c",14,37],[392,"b4","c",15,37],[220,"b4","c",16,3],[182,"b4","c",17,11],[178,"b4","c",18,1],[348,"b4","c",0,0]],"audioUrl":"https://tpdemo.epixode.fr/nggyu.mp3"};

app.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|blob):/);
}]);


app.run(['FioiEditor2Tabsets', '$location', function (tabsets, $location) {

  // Create the tabsets.  This code should execute in a run block rather
  // than inside a controller, which could run multiple times resulting in
  // multiple tabsets with the same name.
  var sources = tabsets.add().update({name: 'sources'});
  tabsets.add().update({name: 'tests'});
  // The call to configureTabsets is safe to perform multiple times.
  configureTabsets(tabsets);
  // Create a tab and load code into it.
  var code1 = sources.addTab().update({title: 'Code1'});
  var buffer = code1.getBuffer().update({text: sampleText, language: 'cpp'});

}]);

function configureTabsets (tabsets) {
  // Configure the tabsets, as some options are not saved as part of a
  // state dump.
  var sources = tabsets.find('sources').update({
    languages: sourceLanguages,
    defaultLanguage: 'cpp',
    titlePrefix: 'Code'
  });
  var tests = tabsets.find('tests').update({
    languages: testLanguages,
    defaultLanguage: 'text',
    titlePrefix: 'Test',
    buffersPerTab: 2
  });
}

app.controller('Main', ['$scope', '$timeout', '$sce', '$uibModal', 'FioiEditor2Tabsets', 'FioiEditor2Signals', 'FioiEditor2Recorder', 'FioiEditor2Audio', 'FioiEditor2Player', function ($scope, $timeout, $sce, $uibModal, tabsets, signals, recorder, audio, player) {
  var controller = this;

  $scope.sampleSize = 2;
  $scope.sampleRateDiv = 1;

  $scope.mode = 'record';
  $scope.modes = [
    {id: 'normal', label: "normal"},
    {id: 'replay', label: 'lecture'},
    {id: 'record', label: 'enregistrement'}
  ];

  // When loading the controller, set the focus on the active tab of the
  // sources tabset.
  $timeout(function () {
    tabsets.find('sources').focus();
  }, 0);

  // The dumpState function is used by the recorder to save the global
  // state.  This implementation saves the tabsets, more elements could
  // be included in the dump.
  function dumpState () {
    return {tabsets: tabsets.dump()};
  }

  // The loadState function is used by the recorder to load a global state.
  // The state passed is a previous result from the dumpState function.
  function loadState (state) {
    // Reload tabsets from the saved state.  This will clear all tabsets,
    // tabs, and buffers.  The recording refers to tabsets, tabs and
    // buffers using their record-time ids.  Fresh ids are used when a state
    // is reloaded, and the recorder keeps track of the relationship between
    // record-time and play-time ids.
    tabsets.load(state.tabsets);
    // The configuration of the tabsets is not stored in the saved state.
    configureTabsets(tabsets);
  }

  var recorderOptions = {
    dumpState: dumpState,
    loadState: loadState
  };

  var recordings = [];
  $scope.recordings = [];

  signals.on('done', function () {
    $scope.$apply(function () {
      $scope.isPlaying = false;
    });
  });

  //
  // Controller actions for the normal mode.
  //

  $scope.save = function () {
    // This example shows how to extract source code from a dump, as an
    // alternative to using getTabs / getBuffers / pullFromControl.
    var source_dump = tabsets.find('sources').dump();
    var source_tabs = source_dump.tabs;
    var active_tab  = source_dump.activeTabId;
    var aSources = _.map(source_tabs, function (tab) {
      var buffer = tab[1].buffers[0][1];
      return {
        sName: tab[1].title,
        sSource: buffer.text,
        sLangProg: buffer.language,
        bActive: tab[0] === active_tab
      };
    });
    console.log('sources', aSources);
    var test_tabs = tabsets.find('tests').dump().tabs;
    var aTests = _.map(test_tabs, function (tab) {
      var in_buf = tab[1].buffers[0][1];
      var out_buf = tab[1].buffers[1][1];
      return {
        sName: tab[1].title,
        sInput: in_buf.text,
        sOutput: out_buf.text
      };
    });
    console.log('tests', aTests);
  };

  //
  // Controller actions for the playback mode.
  //

  $scope.startReplaying = function () {
    if ($scope.isPlaying)
      return; // already playing
    // Set a default recording, if we do not already have one.
    if (!$scope.recording)
      $scope.recording = sampleRecording;
    // Start playback.
    player.start($scope.recording, recorderOptions).then(function () {
      $scope.isPlaying = true;
      $scope.isPaused = false;
    }, function (err) {
      console.log('playback failed to start:', err);
    });
  };
  $scope.stopReplaying = function () {
    if (!$scope.isPlaying)
      return; // already stopped
    player.stop().then(function () {
      $scope.isPaused = false;
      $scope.isPlaying = false;
    }, function (err) {
      console.log('playback failed to stop:', err);
    });
  };
  $scope.pauseReplaying = function () {
    if (!$scope.isPlaying)
      return;
    if ($scope.isPaused) {
      player.resume().then(function () {
        // tabsets.find('sources').focus();
        $scope.isPaused = false;
      }, function (err) {
        console.log('playback failed to resume:', err);
      });
    } else {
      player.pause().then(function () {
        $scope.isPaused = true;
        console.log('paused');
      }, function (err) {
        console.log('playback failed to pause', err);
      });
    }
  };

  //
  // Controller actions for the recording mode.
  //

  $scope.startRecording = function () {
    if ($scope.isRecording)
      return; // already recording
    recorder.record(recorderOptions).then(function (result) {
      $scope.sampleRate = result.sampleRate;
      $scope.isRecording = true;
      tabsets.find('sources').focus();
    }, function (err) {
      console.log('recording failed to start:', err);
    });
  };

  $scope.stopRecording = function () {
    if (!$scope.isRecording)
      return;
    if (!$scope.isPaused) {
      recorder.stop().then(afterStopped, function (err) {
        console.log('recording failed to stop: ', err);
      });
    }
    function afterStopped (recording) {
      $scope.isRecording = false;
      $scope.isPaused = false;
      $scope.recording = recording;
      $scope.mode = 'replay';
      var modalInstance = $uibModal.open({
        templateUrl: 'encodingOptions.html',
        controller: 'EncodingOptionsController',
        resolve: {
          options: function () {
            return {
              numChannels: 1,
              sampleRateDiv: 1,
              sampleSize: $scope.sampleSize,
              sampleRate: $scope.sampleRate,
              duration: recording.duration
            };
          }
        }
      });
      modalInstance.result.then(function (encodingOptions) {
        recorder.finalize(recording, encodingOptions).then(afterFinalized, function (err) {
          console.log('recording failed to be finalized:', err);
        });
      });
    }
    function afterFinalized (recording) {
      return; // UPLOAD DISABLED
      if (!result.audioUrl) {
        // Encoding audio failed and there is nothing to upload.
        return;
      }
      $scope.audioUploadStatus = 'uploading audio...';
      var transloadit = new TransloaditXhr({
        params: {
          auth: {key: "TRANSLOADIT_AUTH_KEY"},
          template_id: "TRANSLOADIT_TEMPLATE_ID",
          steps: {}
        },
        signature: "",
        errorCb: audioUploadFailure,
        progressCb: audioUploadProgress,
        processCb: audioUploadProcess,
        successCb: audioUploadSuccess
      });
      transloadit.uploadFile(result.audioBlob);

      function audioUploadFailure (message) {
        $scope.$apply(function () {
          $scope.audioUploadStatus = "uploading audio failed: " + message;
        });
      }
      function audioUploadProgress (progress) {
        $scope.$apply(function () {
          $scope.audioUploadStatus = 'uploading audio... ' + Math.round(progress) + '%';
        });
      }
      function audioUploadProcess () {
        $scope.$apply(function () {
          $scope.audioUploadStatus = 'processing audio...';
        });
      }
      function audioUploadSuccess (result) {
        $scope.$apply(function () {
          // Update recording with the encoded file's URL.
          $scope.recording.audioUrl = result.mp3[0].ssl_url;
          $scope.audioUploadStatus = false;
        });
      }
    }
  };

  $scope.pauseRecording = function () {
    if (!$scope.isRecording)
      return;
    if ($scope.isPaused) {
      // Start a new segment.
      recorder.resume().then(function () {
        $scope.isPaused = false;
        tabsets.find('sources').focus();
      }, function (err) {
        console.log('recording failed to resume:', err);
      });
    } else {
      recorder.pause().then(function () {
        $scope.isPaused = true;
      }, function (err) {
        console.log('recording failed to pause', err);
      });
    }
  };

  //
  // Controller actions common to all modes.
  //

  $scope.submitActiveBuffer = function () {
    // This example shows how to extract source code from a single buffer.
    var buffer = tabsets.find('sources').getActiveTab().getBuffer().pullFromControl();
    console.log(buffer.language, buffer.text);
  };

}]);

app.controller('EncodingOptionsController', ['$scope', 'options', '$modalInstance', function ($scope, options, $modalInstance) {
  angular.extend($scope, options);
  $scope.ok = function () {
    $modalInstance.close({
      numChannels: 1,
      sampleSize: $scope.sampleSize,
      sampleRate: $scope.sampleRate / $scope.sampleRateDiv
    });
  };
}]);

angular.element(document).ready(function () {
  angular.bootstrap(document, ['main'], {strictDi: true});
});
