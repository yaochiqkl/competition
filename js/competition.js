		$(document).keydown(function(e){   
		        var keyEvent;   
		        if(e.keyCode==8){   
		            var d=e.srcElement||e.target;   
		             if(d.tagName.toUpperCase()=='INPUT'||d.tagName.toUpperCase()=='TEXTAREA'){   
		                 keyEvent=d.readOnly||d.disabled;   
		             }else{   
		                 keyEvent=true;   
		             }   
		         }else{   
		             keyEvent=false;   
		         }   
		         if(keyEvent){   
		             e.preventDefault();   
		         }   
		 });
		$(".top , #nextButton").hide();
		var current_index = 0; //当前单词索引
		var user_win_num = 0,  //用户和机器人得分
			robot_win_num = 0;
		var total_words_num = word_json.words.length; //单词长度
		var overtime = 12;
		var data = {
			"details":[]
		};
		$(function(){
			//Ajax请求
			//getJSON();
			$(window).resize(checkWindowSize);
			//本地请求
			initPage(current_index);	
			$(".top , #nextButton").show();
		});
		function initPage(n){
			dataInit(n);
			checkWindowSize();
			timeInit();
			inputInit(n);
			$("#nextButton").unbind("click").click(function(){
				nextClick(current_right_need-current_robot_right_num);
			});
		}
		//Time controller
		function timeInit() {
		    msec = 0;
			sec = 0;
			min = 0;
			totalmsec = 0;
			//$("#startTime").click(startTime);
			//$("#stopTime").click(stopTime);
			startTime();
		}
		function startTime() {
			//time start
			timeStart = null;
			timeStart = setInterval(addTime,100);
			checkRobot();
		}
		function addTime() {
			totalmsec += 100;
			msec += 100;
			if (msec > 900) {
				msec -= 1000;
				sec++; 
				checkRobot();
			}
			if (sec >= 60) {
				sec -= 60;
				min++;
			}
			//$("#time").text(fixTime(min)+':'+fixTime(sec)+':'+fixMsec(msec));
		}
/*		function fixTime(i){
			if (i < 10) {
				i = '0' + i;
			}
			return i;
		}
		function fixMsec(i){
			if (i < 10) {
				i = '00' + i;
			}
			return i;
		}*/
		function stopTime() {
			//console.log("stop!");
			clearInterval(timeStart);
			//clearInterval(vm_time_bg);
			//console.log(totalmsec);
		}
		//data initialization
		function dataInit(n){
			//init inputs
			current_word = word_json.words[n];
			current_right_answer = current_word.name;
			current_right_num = 0;
			current_right_need = 0;
			current_word_length = current_word.name.length;
			current_user_right_num = 0;
			current_robot_right_num = 0;
			current_user_accuracy = 0;
			detail = {
				"word" : current_right_answer
			};
			current_user_time = "";
			//detial time array initializtion
			detail.time = new Array(current_word_length);
			for (var j = 0; j < current_word_length; j++){
				detail.time[j] = null;
			}
			
			$("#input-area").html("");
			$("#tip-area").html("");
			for (var i = 0; i < current_word.name.length; i++){
				//console.log(current_word.name[i]);
				if(current_word.show[i] === 1){
					html = "<input type='text' class='defalut' readonly value="+current_word.name[i]+">";
					$("#input-area").append(html);
				} else {
					current_right_need++;
					html = "<input type='text' maxlength='1'>";
					$("#input-area").append(html);
				}
			}
			//init tips
			//console.log(current_word.correlation);
			for (i = 0; i < current_word.correlation.length ; i++){
				html = "<div class='tip'>"+current_word.correlation[i]+"</div>";
				$("#tip-area").append(html);
			}
		}
		//input controller
		function inputInit(){
			$inputRequire = $("#input-area>input:not(.defalut)");
			$inputRequire[0].focus();
			$("#input-area input:not(.defalut)").bind("keyup",jumpNext);
		}
		function jumpNext(event){
			if ($(this).val().length === 1){
				var nn = $(this).nextAll("input:not(.correct , .defalut , .lock)");
				//fix bug: nn is not a jquery object but a DOM object
				if( nn.length !== 0){
					$(nn[0]).focus().click();
					$(nn[0]).val("");
				} else {
					checkInputWithoutJump($(this));
					if($(this).hasClass("correct")){
						var xx = $("#input-area>input.incorrect:not(.lock)");
						if( xx.length !== 0){
							//console.log("跳到第一个空");
							$(xx)[0].click();
							$(xx)[0].focus();
						} else {
							//$(this).unbind("keyup",jumpNext);
							//console.log("bug");
						}
					} else {
						//console.log("不跳");
					}
				} 
				checkInput($(this));
			}
			if ( $(this).val().length === 0 && event.keyCode === 8) {
				console.log("跳到上一个空");
				var mm = $(this).prevAll(".incorrect:not(.lock)");
				$(this).removeClass("incorrect");
				if ($(mm) !== 0){
					$(mm[0]).focus().click();
				}
			}
		}
		function checkInput($n){
			if ($n.val().toLowerCase() === current_right_answer.substr($n.index(),1) ){
				$n.addClass("correct");
				$n.attr("readonly","readonly");
				current_user_right_num ++;
				current_right_num ++ ;
				addScore("user");
				detail.time[$n.index()] = sec;
				$n.unbind("keyup",jumpNext);
				//console.log("取消绑定");
			} else{
				$n.addClass("incorrect").click(changeInput);
			}
			nextQuestion();
		}
		function checkInputWithoutJump($n){
			if ($n.val().toLowerCase() === current_right_answer.substr($n.index(),1) ){
				$n.addClass("correct");
				$n.attr("readonly","readonly");
				detail.time[$n.index()] = sec;
			} else{
				$n.addClass("incorrect").click(changeInput);
			}
		}
		function nextQuestion(){
			// next question
			if (current_right_num === current_right_need){
				setTimeout(nextQuestionInit,1000);
			}
		}
		//click "next question"
		function nextClick(num){
			robot_win_num += num;
			addScore(num);
			setTimeout(updateScore,500);
			nextQuestionInit();
		}
		function nextQuestionInit(){
			//add accuracy data
			current_word.accuracy = current_user_right_num/current_right_need;
			current_index ++ ;
			data.details.push(detail);
			sendDataByGet();
			if (current_index === total_words_num - 1) {
				$("#nextButton").remove();
			}
			if (current_index !== total_words_num) {
				stopTime();
				initPage(current_index);
			} else {
				stopTime();
				judgeWinner();
			}
		}
		function changeInput(){
			if ($(this).hasClass("incorrect")){
				$(this).removeClass("incorrect").val("");
			}
		}
		function checkRobot(){
			for (var i = 0; i < current_word_length; i++ ) {
				if ( sec === current_word.AI[i]) {
					var $n = $("#input-area input:eq("+i+")");
					if (!$n.hasClass("defalut") && !$n.hasClass("correct")){
						$n.addClass("lock");
						//$n.blur();
						$n.attr("readonly","readonly");
						$n.val(current_right_answer.substr(i,1));
						if ($n.is(":focus")) {
							$n.next().focus().click();
						}
						current_robot_right_num ++;
						current_right_num ++ ;
						addScore("robot");
						nextQuestion();
					}

				}
			}
			if (sec === overtime) {
				overtimeHandle();
				overtimeEffect();
			}
		}
		function addScore(person){
			if ( person === "user"){
				user_win_num++;
				addLeftScore(1);
			} else if (person === "robot"){
				robot_win_num++;
				addRightScore(1);
			} else if (person === "next"){
				robot_win_num += 5;
				addRightScore(5);
			} else {
				addRightScore(person);
			}
			updateScore();
		}
		function updateScore () {
			setTimeout(function(){
				$("#left-score").html(user_win_num);
				$("#right-score").html(robot_win_num);
			},500);
		}
		function judgeWinner(){
			sortAccuracy();
			//sendData();
			//$("#nextButton").unbind("click",nextClick);
			if (user_win_num > robot_win_num) {
				insertWin(1);
			} else if (user_win_num === robot_win_num){
				insertWin(0);
			} else {
				insertWin(-1);
			}
			//for ()
		}
		function getJSON(){
			console.log("getJSON");
			$.ajax({
				type: "GET",
				contentType:"application/json;charset=utf-8",
				url: "/demo/get_words",
				//data: JSONdata,
				dataType: "json",
				success: function (data, textStatus){
					word_json = data;
					$(".top , #nextButton").show();
					console.log("getJSON succussfully :" +textStatus);
					//从ajax请求
					setTimeout(function(){
						$("#input-area").html("匹配成功");
						},1000);
					setTimeout(initPage,2500);
				},
				error: function (){
					setTimeout(function(){
						$("#input-area").html("请求失败");
						},2500);
					console.log("haven't getJSON");
				}
			});
		}
		function sendData(){
			var JSONdata = JSON.stringify(data);
			console.log(JSONdata);
/*			$.ajax({
				type: "POST",
				contentType:"application/json;charset=utf-8",
				url: "/demo/update_user_word_time",
				data: JSONdata,
				dataType: "json",
				success: function (){
					console.log("sending succussfully");
				},
				error: function (){
					//console.log("haven't sent");
				}
			});*/
		}
		function sendDataByGet(){
			for (var i = 0; i < current_word_length; i++) {
				current_user_time = current_user_time + "|" + detail.time[i];
			}
			current_user_time = current_user_time.slice(1);
			console.log(current_user_time);
			$.ajax({
				type: "GET",
				contentType:"application/json;charset=utf-8",
				url: "/demo/update_user_word_time",
				data: {word: current_right_answer, time: current_user_time},
				dataType: "json",
				success: function (){
								console.log("sending time succussfully");
							},
				error: function (){
								//console.log("haven't sent");
							}
			});
		}
		function checkWindowSize(){
			var height = $(window).height();
			if ( height < 300 ) {
				$(".tip").addClass("small");
			} else if ($(".tip").hasClass("small")) {
				$(".tip").removeClass("small");
			}
		}
		function sortAccuracy(){
			console.log(word_json.words);	
			insertSort(word_json.words);
		}
		//Straight Insertion Sort 直接插入排序
		function insertSort(A){
			//var A = array;
			var key = null;
			var i = null;
			for (var j = 1; j< total_words_num; j++) {
				key = A[j];
				i = j - 1;
				while( i > -1 && A[i].accuracy > key.accuracy){
					A[i+1] = A[i];
					i--;
				}
				A[i+1] = key;
			}
			showAccuracy();
		}
		function showAccuracy(){
			/*for (var i = 0; i < total_words_num; i++) {
				console.log(word_json.words[i].name+":Accuracy = "+ word_json.words[i].accuracy);
			}*/
			$("#input-area").html("");
			$("#tip-area").html("");
			for (var j = 0; j < total_words_num; j++){
				html = "<div class='tip'>"+word_json.words[j].name+"</div>";
				$("#tip-area").append(html);
			}
		}
		function overtimeHandle(){
			console.log("超时了！");
			for (var i = 0; i < current_word_length; i++ ) {
				var $n = $("#input-area input:eq("+i+")");
				if (!$n.hasClass("defalut") && !$n.hasClass("correct") && !$n.hasClass("lock") ){
					$n.addClass("defalut");
					$n.attr("readonly","readonly");
					$n.val(current_right_answer.substr(i,1));
					$n.blur();
					nextQuestion();
				}
			}
			setTimeout(nextQuestionInit,1000);
		}
		function addLeftScore(score){
			var $score1 = $("<div class='leftScore'>+"+score+"</div>");
			$(".score-area").append($score1);
			$score1.animate({left:"+=20%",fontSize:"+=22px"},400)
				.animate({opacity:"0",left:"+=5%",top:"-=5%",fontSize:"-=10px"},100,function(){
					$score1.remove();
				});

		}
		function addRightScore(score){
			var $score2 = $("<div class='rightScore'>+"+score+"</div>");
			$(".score-area").append($score2);
			$score2.animate({left:"-=20%",fontSize:"+=22px"},400)
				.animate({opacity:"1",left:"-=5%",top:"-=5%",fontSize:"-=10px"},100,function(){
					$score2.remove();
				});

		}
		function overtimeEffect(){
			console.log("overtimeEffect");
			var $overtime = $("<span id='overtime' class='label label-default'>超时</span>");
			$(".header").after($overtime);
			$overtime.fadeIn(2000);
			$overtime.fadeOut(2000);
		}
		function insertWin(num){
			var $again = $("<button id='again' type='button' class='btn btn-primary '>再来一次</button>");
			$(".header").after($again);
			$("#again").click(function(){
				location.reload();
			});
			if (num === 1) {
				$win = $("<span id='win' class='label label-success'>WIN</span>");
				$(".header").after($win);
			} else if (num === 0) {
				$win = $("<span id='win' class='label label-info'>平局</span>");
				$(".header").after($win);
			} else {
				$win = $("<span id='win' class='label label-default'>LOSE</span>");
				$(".header").after($win);
			}

		}
