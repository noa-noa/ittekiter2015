/**
 * TODO
 * 経由地の追加
 */

 (function(global) {
 	"use strict";

 	function Ittekiter() {
 		Ittekiter.prototype.setOverlay();
 		Ittekiter.prototype.initMap();
 	}

 	Ittekiter["prototype"]["initMap"] = initMap;
 	Ittekiter["prototype"]["setOverlay"] = setOverlay;
 	Ittekiter["prototype"]["setSize"] = setSize;
 	Ittekiter["prototype"]["setEvent"] = setEvent;
 	Ittekiter["prototype"]["addAlibi"] = addAlibi;
 	
	/**
	 * マップの初期化
	 */
	 function initMap() {
	 	var opts = {
	 		zoom: 8,
	 		center: new google.maps.LatLng(36.086338,140.10617100000002),
	 		disableDefaultUI: true,
	 		disableDoubleClickZoom: true,
	 		mapTypeId: google.maps.MapTypeId.ROADMAP
	 	};

	 	this.map = new google.maps.Map(document.getElementById("map"), opts);
	 	this.rootSearcher = new RootSearcher(this.map, $("#overlay__form__content__inner"));

		// POIのポップアップを無効化
		(function fixInfoWindow() {
			var set = google.maps.InfoWindow.prototype.set;
			google.maps.InfoWindow.prototype.set = function(key, val) {
				if (key === "map") {
					if (! this.get("noSuppress")) {
						return;
					}
				}
				set.apply(this, arguments);
			}
		})();
	};

	/**
	 * スタート画面の設定
	 */
	 function setOverlay() {
		// ノードのキャッシング
		this.elements = {
			$set_from: $("#set_from"),
			$set_to: $("#set_to"),
			$set_date: $("#set_date"),
			$set_time: $("#set_time"),
			$change_from: $("#change_from"),
			$change_to: $("#change_to"),
			$change_date: $("#change_date"),
			$change_time: $("#change_time"),
			$base: $("#base"),
			$overlay: $("#overlay")
		};

		this.elements.$overlay__inner = this.elements.$overlay.find("#overlay__inner");
	};

	/**
	 * 要素のサイズ設定
	 */
	 function setSize() {
		// スタート画面フォームの中央配置
		var margin = $(window).height() - this.elements.$overlay__inner.find("#overlay__logo").outerHeight(true) - this.elements.$overlay__inner.find("#overlay__form").outerHeight(true);

		if (margin < 0)
			margin = 0;

		this.elements.$overlay__inner.css({
			marginTop: margin / 2
		});
	};

	/**
	 * イベントの登録
	 */
	 function setEvent() {
	 	var it = this;

		// アリバイ作成(スタート画面)
		// "tap"(EventType): jquery.finger.js (click + touch)
		it.elements.$overlay.find("#make_alibi").on("tap", function() {
			// スタート画面
			// フェードアウト->非表示(display: none)->ルート検索
			// $.transition: jquery.transit.js
			it.elements.$overlay.transition({
				opacity: 0
			}, function() {
				setTimeout(function() {
					it.rootSearcher.searchRoot(function(result, departure) {
			 			var data = {
			 				route_object: JSON.stringify(result),
			 				departure: departure
			 			};
						$.post("/add", data, function(id){
							it.addAlibi(id, result, departure)
			 			});
					});
					google.maps.event.trigger(it.map, "resize");
				}, 400);
				it.elements.$base.addClass('base--started');
				it.elements.$overlay.css({
					display: "none"
				});
			});
		});

		/*瑛彦が書いた*/
		it.elements.$overlay.find("#sign_in").on("tap",function(){
			location.href="http://localhost:3000/auth/twitter";
		});
		it.elements.$overlay.find("#sign_out").on("tap",function(){
			location.href="http://localhost:3000/logout";
		});
		/*瑛彦が書いた*/

		it.elements.$overlay.find("#overlay__goimadoko").on("tap", function() {
			it.elements.$overlay.transition({
				opacity: 0
			}, function() {
				setTimeout(function() {
					it.elements.$base.addClass('base--sidebaropened');
					var $currentAlibi = $("#alibi-list .panel-primary, #alibi-list .panel-info").last();
					if ($currentAlibi.length)
						$currentAlibi.find(".panel-heading").trigger('click');
					else
						$(".panel-heading[href=#alibi-list-add]").trigger('click');
					google.maps.event.trigger(it.map, "resize");
				}, 400);
				it.elements.$base.addClass('base--started');
				it.elements.$overlay.css({
					display: "none"
				});
			});
		})

		// サイドバートグル
		$("#base__toggle_sidebar").on("tap", function() {
			it.elements.$base.toggleClass('base--sidebaropened');
		});

		// サイドバースワイプ
		$("body").on('flick', "#base.base--sidebaropened #sidebar", function(e) {
			if ('horizontal' == e.orientation && -1 == e.direction) {
				it.elements.$base.removeClass('base--sidebaropened');
			}
		});

		google.maps.event.addDomListener(window, "resize", function() {
			var center = it.map.getCenter();
			google.maps.event.trigger(it.map, "resize");
			it.map.setCenter(center); 
		});

		var $item = $("#alibi-list-add")
	 	var sidebarSearcher = new SidebarRootSearcher(this, $item);

		$item.find(".add_root").on("tap", function() {
			$("#base").removeClass('base--sidebaropened');
			sidebarSearcher.searcher.searchRoot(function(result, departure) {
	 			var data = {
	 				route_object: JSON.stringify(result),
	 				departure: departure
	 			};
				$.post("/add", data, function(id){
					it.addAlibi(id, result, departure)
	 			});
			});

			$item.one('hidden.bs.collapse', clearForm.bind(sidebarSearcher.searcher));
		});

		var it = this;
		$.get("get_alibis",function(json) {
			for (var i = 0; i < json.length; i++) {
				it.addAlibi(json[i].id, JSON.parse(json[i].route_object), new Date(Date.parse(json[i].dep_time)));
			}
		});
	};

	/**
	 * addAlibi get(~~, ~~, function(json) {it.addAlibi(json.root, json.departure);})
	 * @param {google.maps.DirectionsResult} root      ルート
	 * @param {Date}                         departure 出発日時
	 */
	 function addAlibi(id, root, departure) {
	 	var placesService = new google.maps.places.PlacesService(this.map);
	 	var title = (function () {
	 		var title = root.request.destination.place.name;
			if (root.request.waypoints.length > 0)
				title += '&nbsp;<small style="white-space: nowrap;">など'+(root.request.waypoints.length + 1)+'ヶ所</small>';
			return title+'<br><small style="white-space: nowrap;">'+departure.getFullYear()+'年'+(departure.getMonth() + 1)+'月'+departure.getDate()+'日 '+("0"+departure.getHours()).slice(-2)+':'+("0"+departure.getMinutes()).slice(-2)+'</small>';
	 	})();
	 	var template = '<div class="panel panel-default alibi-list-item"> <div class="panel-heading collapsed" role="button" data-toggle="collapse" data-parent="#alibi-list" href="#alibi-list-item'+id+'" aria-expanded="false" aria-controls="alibi-list-item'+id+'"> <h4 class="panel-title">'+title+'</h4> </div> <div id="alibi-list-item'+id+'" class="panel-collapse collapse alibi-collapse" role="tabpanel" aria-labelledby="headingAlibiListItem'+id+'"> <div class="panel-body"> <form> <div class="form-group"> <label>出発地</label> <div class="form-places-group"> <span class="form-places-addon"> <span class="form-places-addon-inner">A.</span> </span> <input role="button" class="form-places place-origin" type="text" placeholder="どこから？"> </div> </div> <div class="form-group" style="margin-bottom: 0;"> <label>目的地</label> <div class="form-places-group"> <span class="form-places-addon"> <span class="form-places-addon-inner">B.</span> </span> <input role="button" class="form-places place-destination" type="text" placeholder="どこいく？"> </div> <div class="clearfix"> <span role="button" class="form-places-button form-places-add"><i class="glyphicon glyphicon-plus-sign"></i>&nbsp;目的地を追加</span> </div> </div> <div class="form-group"> <label>日時</label> <div class="clearfix"> <input role="button" class="form-places form-places-date place-day" type="text" placeholder="いついく？"> <input role="button" class="form-places form-places-date place-time" type="text" placeholder="時間"> </div> </div> <div class="row"><div class="col-xs-6" style="padding-right: 5px;"><button type="button" class="btn btn-primary btn-block search_root modify_root" disabled>再検索</button></div> <div class="col-xs-6" style="padding-left: 5px;"><button type="button" class="btn btn-danger btn-block delete_alibi">削除</button></div></div> </form> </div> </div> </div>';
	 	
	 	var $allitem = $("#alibi-list .alibi-collapse");
	 	var i = 0;

	 	if ($allitem.length > 1 && typeof $.data($allitem[1], "arrival") !== "undefined") {
		 	while (i < $allitem.length - 1 && $.data($allitem[i + 1], "arrival") > root.arrival) {
		 		i++;
		 	}
		}

	 	$allitem.eq(i).closest(".panel").after(template);

	 	var $item = $("#alibi-list-item"+id);

	 	$.data($item[0], 'id', id);
	 	$.data($item[0], 'departure', departure);
	 	$.data($item[0], 'arrival', root.arrival);

		// 場所情報をフォームにパース・
		var $pd = $item.find(".place-origin");
		$pd.val(root.request.origin.value);

		root.request.origin.place.geometry.location = new google.maps.LatLng(root.request.origin.place.geometry.location.latitude, root.request.origin.place.geometry.location.longitude);

		$.data($pd[0], "value", root.request.origin.value);
		$.data($pd[0], "place", root.request.origin.place);
		$.data($pd[0], "searchEnable", true);

		$.each(root.request.waypoints, function(i, waypoint) {
			var $fg = $item.find(".form-places-group:last");
			var $pd = $fg.find(".place-destination");
			$pd.val(waypoint.location.value);

			waypoint.location.place.geometry.location = new google.maps.LatLng(waypoint.location.place.geometry.location.latitude, waypoint.location.place.geometry.location.longitude);

			$.data($pd[0], "value", waypoint.location.value);
			$.data($pd[0], "place", waypoint.location.place);
			$.data($pd[0], "searchEnable", true);

			$fg.after('<div class="form-places-group"> <span class="form-places-addon"> <span class="form-places-addon-inner">'+String.fromCharCode(i + 67)+'.</span> </span> <input role="button" class="form-places place-destination" type="text" placeholder="どこいく？"> </div>');
		});

		var $fg = $item.find(".form-places-group:last");
		var $pd = $fg.find(".place-destination");
		$pd.val(root.request.destination.value);

		root.request.destination.place.geometry.location = new google.maps.LatLng(root.request.destination.place.geometry.location.latitude, root.request.destination.place.geometry.location.longitude);

		$.data($pd[0], "value", root.request.destination.value);
		$.data($pd[0], "place", root.request.destination.place);
		$.data($pd[0], "searchEnable", true);

		if (root.request.waypoints.length > 0)
			$fg.append('<span role="button" class="badge form-places-remove"><i class="glyphicon glyphicon-remove"></i></span>');

		// SidebarRootSearcherのインスタンスを生成
		var sidebarSearcher = new SidebarItem(this, $item, root, departure);

		if ($("#base").hasClass('base--started'))
			$item.prev(".panel-heading").trigger("click");
	}

	/**
	 * アリバイのパネル云々のクラス
	 * @param {Ittekiter}                    it        Ittekiterのインスタンス
	 * @param {jQuery Object}                $item     .panel-collapseの要素
	 * @param {google.maps.DirectionsResult} root      ルートオブジェクト
	 * @param {Date}                         departure 出発時間
	 */
	function SidebarItem(it, $item ,root, departure) {
		var sidebarSearcher = new SidebarRootSearcher(it, $item);
		var searcher = sidebarSearcher.searcher;

		this.searcher = searcher;

		var item = this;

		this.$item = $item;
		this.root = root;
		this.departure = departure;

		// 日時をパース
		searcher.setDateTime(departure);
		searcher.checkForm();

	 	this.imakoko = new google.maps.Marker({
	 		map: it.map,
	 		visible: false
	 	});

		var panelColorManager = setInterval(function() {
			var currentTime = new Date();
			var passTime = $.data($item[0], "departure").getTime();
			var arrival = $.data($item[0], "arrival");

			if (arrival > currentTime && currentTime > passTime)
				$item.closest('.panel').removeClass('panel-default panel-info').addClass('panel-primary');
			else if (arrival <= currentTime)
				$item.closest('.panel').removeClass('panel-primary panel-info').addClass('panel-default');
			else
				$item.closest('.panel').removeClass('panel-default panel-primary').addClass('panel-info');
		}, 1000);

		$item.on("show.bs.collapse", function() {
			item.renewMapDisplay();
			var imadokoDisplay = setInterval(imadokoDisplayFunc.bind(item), 1000);
			item.makePop();

			// 別なアリバイを開いた時
			google.maps.event.addListenerOnce(searcher.directionsDisplay, "directions_changed", function() {
				item.clearPop();
				clearInterval(imadokoDisplay);
				item.imakoko.setVisible(false);
				$item.find(".modify_root").off("tap");
				$item.find(".delete_alibi").off("tap");
				searcher.directionsDisplay.setMap(it.map);
			});

			function modifyRoot() {
				$("#base").removeClass('base--sidebaropened');
				searcher.searchRoot(function(result, departure) {
					var data = {
						id: $.data($item[0], 'id'),
						route_object: JSON.stringify(result),
						departure: departure
					}

					$.post("/update_alibi", data, function(){
						item.clearPop();
						item.makePop();
					});

					var $destination = $item.find(".place-destination:last");
					var title = $.data($destination[0], "place").name;
					if (result.request.waypoints.length > 0)
						title += '&nbsp;<small style="white-space: nowrap;">など'+(result.request.waypoints.length + 1)+'ヶ所</small>';
					title += '<br><small style="white-space: nowrap;">'+departure.getFullYear()+'年'+(departure.getMonth() + 1)+'月'+departure.getDate()+'日 '+("0"+departure.getHours()).slice(-2)+':'+("0"+departure.getMinutes()).slice(-2)+'</small>';
					$item.prev(".panel-heading").find(".panel-title").html(title);

					$.data($item[0], 'departure', departure);
					$.data($item[0], 'arrival', result.arrival);

					item.root = result;
					item.departure = departure;

					item.renewMapDisplay();
					$item.find(".modify_root").on("tap", modifyRoot);

					var imadokoDisplay = setInterval(imadokoDisplayFunc.bind(item), 1000);
					google.maps.event.addListenerOnce(searcher.directionsDisplay, "directions_changed", function() {
						item.clearPop();
						clearInterval(imadokoDisplay);
						item.imakoko.setVisible(false);
						$item.find(".modify_root").off("tap");
						$item.find(".delete_alibi").off("tap");
						searcher.directionsDisplay.setMap(it.map);
					});

				 	var $allitem = $("#alibi-list .alibi-collapse");
				 	var i = 0;

				 	if ($allitem.length > 1 && typeof $.data($allitem[1], "arrival") !== "undefined") {
					 	while (i < $allitem.length - 1 && ($.data($allitem[i + 1], "arrival") > result.arrival || $($allitem[i + 1]).attr("id") === $item.attr("id"))) {
					 		i++;
					 	}
					}

				 	$allitem.eq(i).closest(".panel").after($item.closest(".panel"));
				});
			}

			$item.find(".modify_root").on("tap", modifyRoot);
			$item.find(".delete_alibi").on("tap", function() {
				var $panel = $item.parent(".panel");
				var $prev = $panel.prev(".panel");
				var $next = $panel.next(".panel");

				$.get("/delete_alibi", {id: $.data($item[0], 'id')}, function(){
					$panel.remove();
					item.clearPop();

					clearInterval(imadokoDisplay);
					clearInterval(panelColorManager);
					searcher.directionsDisplay.setMap(null);
					item.imakoko.setMap(null);

					if ($next.length)
						$next.find(".panel-heading").trigger("click");
					else
						$prev.find(".panel-heading").trigger("click");
				});
			});
		});
	}

 	SidebarItem["prototype"]["imadokoDisplayFunc"] = imadokoDisplayFunc;
 	SidebarItem["prototype"]["renewMapDisplay"] = renewMapDisplay;
 	SidebarItem["prototype"]["makePop"] = makePop;
 	SidebarItem["prototype"]["clearPop"] = clearPop;

 	/**
 	 * いまどこのマーカーを移動させるやつ
 	 */
	function imadokoDisplayFunc() {
		var passTime = this.departure.getTime();
		var currentTime = new Date();
		currentTime = currentTime.getTime();

		if (this.root.arrival > currentTime && currentTime > passTime) {
			for (var i = 0; i < this.root.routes.length; i++) {
				for (var j = 0; j < this.root.routes[i].legs.length; j++) {
					for (var k = 0; k < this.root.routes[i].legs[j].steps.length; k++) {
						var step = this.root.routes[i].legs[j].steps[k];

						// このstepに入ってからの経過時間
						var passed = currentTime - passTime;
						// このstepの長さ
						var duration = step.duration.value * 1000;
						passTime += duration;

						if (passTime > currentTime) {
							var index = parseInt(step.path.length * (passed / duration));
							if (index < 0) index = 0;
							// if (typeof step.path[index].latitude !== "undefined")
							// 	step.path[index] = new google.maps.LatLng(step.path[index].latitude, step.path[index].longitude);
							this.imakoko.setPosition(step.path[index]);
							this.imakoko.setVisible(true);
							passTime = this.departure;
							return;
						}
					}
					passTime += 3600000;
				}
			}
		} else {
			this.imakoko.setVisible(false);
		}
	}

	/**
	 * 表示時・再検索に使う
	 */
	function renewMapDisplay() {
		for (var i = 0; i < this.root.routes.length; i++) {
			// google mapsのオブジェクトにパース(パース済みのものはパースしない)
			if (typeof this.root.routes[i].bounds.sw !== "undefined") {
				this.root.routes[i].bounds = new google.maps.LatLngBounds(new google.maps.LatLng(this.root.routes[i].bounds.sw.latitude, this.root.routes[i].bounds.sw.longitude), new google.maps.LatLng(this.root.routes[i].bounds.ne.latitude, this.root.routes[i].bounds.ne.longitude));
				for (var j = 0; j < this.root.routes[i].legs.length; j++) {
					var leg = this.root.routes[i].legs[j];
					this.root.routes[i].legs[j].start_location = new google.maps.LatLng(leg.start_location.latitude, leg.start_location.longitude);
					this.root.routes[i].legs[j].end_location = new google.maps.LatLng(leg.end_location.latitude, leg.end_location.longitude);
					for (var k = 0; k < this.root.routes[i].legs[j].steps.length; k++) {
						for (var l = 0; l < this.root.routes[i].legs[j].steps[k].path.length; l++) {
							var path = this.root.routes[i].legs[j].steps[k].path[l];
							this.root.routes[i].legs[j].steps[k].path[l] = new google.maps.LatLng(path.latitude, path.longitude);
						}
					}
				}
			}
		}

		this.imakoko.setVisible(true);
		this.searcher.directionsDisplay.setDirections(this.root);
	}

	function clearPop()
	{
		for (var t = 0; t < this.popups.length; t++) {
			this.popups[t].setMap(null);
		}
	}

	function makePop()
	{
		var res = this.root;
		var rs = this.searcher;
		var leg_len = res.routes[0].legs.length;
		rs.placesService = new google.maps.places.PlacesService(rs.map);

		var request = new Array(leg_len);

		this.popups = [];
		var item =this;

		for(var i = 0;i<leg_len;i++){
			request[i]={
				location: res.routes[0].legs[i].end_location,
				radius: '1000',
				types: ['amusement_park', 'aquarium', 'art_gallery', 'bakery', 'bowling_alley', 'cafe', 'campground', 'casino', 'cemetery', 'church', 'food', 'gym', 'health', 'hindu_temple', 'library', 'mosque', 'movie_theater', 'museum', 'park', 'restaurant', 'spa', 'stadium', 'synagogue', 'zoo']

			};
		}

		$.get("/get_tweet", {id: $.data(this.$item[0], "id")}, function(json) {
			if (json.length == 0) {
				var results_len=[];
				for(i=0;i<leg_len;i++){ 
					rs.placesService.nearbySearch(request[i], function (results, status) {
						if (status == google.maps.places.PlacesServiceStatus.OK) {
								results_len.push(results.length);
							for (var s = 0; s < results.length && s < 3; s++) {
								item.popups.push(new ExpandablePopup(rs.map, results[s].geometry.location, results[s].name));

								if(results[s].duration =="undefined"){results[s].duration=0;}
								twitimeset(results_len,item.popups,results[s],res.routes[0].legs,item.departure);

								item.popups[item.popups.length - 1].loadContent = loadPlacesContent.bind(item.popups[item.popups.length - 1], results[s]);
							}
						}
						else
						{
							results_len.push(0);
						}
					});
				}
			}
			else
			{
				for(var i=0;i<json.length;i++){
					var location={A: 0.00000000,F:0.00000000};

					location = new google.maps.LatLng(json[i].twilat, json[i].twilng);

					item.popups.push(new ExpandablePopup(rs.map, location, json[i].name));
					json[i].twidt = new Date(Date.parse(json[i].twidt));
					item.popups[item.popups.length - 1].loadContent = akihikoPlacesContent.bind(item.popups[item.popups.length - 1], json[i]);
				}
			}
		}, "json");
	}

	function twitimeset(results_len,popups,point,res,dep){
		var nearby_num=[];
		var route_time=[];//そのルートにかかる時間
		var point_time=[];
		var pre_time=0;
		var now = dep.getTime();
		for(var i=0;i<results_len.length;i++){
			if(results_len[i]<3){
				nearby_num[i]=results_len[i];
			}else if(3<=results_len[i])
			{
				nearby_num[i]=3;
			}
			route_time[i]=res[i].duration.value;
//			if(points[i].name == point.name)
		}
		var s=0;

		for(var t=0;t<nearby_num.length;t++){
			for(s=0;s<nearby_num[t];s++){
				point_time.push(((pre_time+route_time[t])*1000+now));
			}
			pre_time+=route_time[t]+3600;
		}
		for(t=0;t<popups.length;t++){
			popups[t].duration = point_time[t];
	//		point_time[t]= new Date(point_time[t]);
			if(point.name==popups[t].content){
				point.duration=popups[t].duration;
			}
		}
	}


	/**
	 * サイドバー用の検索クラス
	 * @param {Ittekiter}     it    Ittekiterのインスタンス
	 * @param {jQuery Object} $item .panel-collapseの要素
	 */
	function SidebarRootSearcher(it, $item) {
		// イベントの設定
		this.searcher = new RootSearcher(it.map, $item.find("form"));

		var searcher = this.searcher;
		$item.find(".form-places-add").on('tap', function() {
			var $formGroup = $(this).closest(".form-group");
			var length = $formGroup.find(".form-places-group").length;
			if (length < 9) {
				$formGroup.find(".form-places-remove").remove();
				$('<div class="form-places-group"> <span class="form-places-addon"> <span class="form-places-addon-inner">'+String.fromCharCode(length + 66)+'.</span> </span> <input role="button" class="form-places place-destination" type="text" placeholder="どこいく？"> <span role="button" class="badge form-places-remove"><i class="glyphicon glyphicon-remove"></i></span> </div>').insertAfter($formGroup.find(".form-places-group:last"));
				searcher.addPlace($formGroup.find(".place-destination:last")[0]);
			}
		})
		$item.on('tap', ".form-places-remove", function() {
			var $this = $(this);
			var $formGroup = $this.closest(".form-group");
			$this.closest(".form-places-group").remove();
			searcher.checkForm();
			if ($formGroup.find(".form-places-group").length > 1)
				$formGroup.find(".form-places-group:last").append('<span role="button" class="badge form-places-remove"><i class="glyphicon glyphicon-remove"></i></span>');
		});
	}

	/**
	 * ルート検索クラス
	 * @param {google.maps.Map} map   Googleマップのインスタンス
	 * @param {jQuery Object}   $form ルート検索用のフォーム
	 */
	 function RootSearcher(map, $form) {
		// ルート検索フィールの埋まり具合
		this.searchEnable = {
			date: false,
			time: false
		};

		// ルート検索用のデータ
		this.searchData = {
			date: null,
			time: null
		};

		this.map = map
		this.directionsDisplay.setMap(this.map);

		this.$form = $form;
		this.$search_root = $form.find(".search_root:not(.abs_disable)");

		// プレイスオートコンプリート
		this.placesOptions = {
			types: ['establishment']
		};

		var rs = this;
		$.each($form.find(".place-origin, .place-destination"), function() {
			rs.addPlace(this);
		});

		// picker.js + picker.date.js + picker.time.js + legacy.js
		// (Styling) default.css + default.date.css + default.time.css
		var dateOption = {
			container: '#picker_container',
			clear: '',
			min: new Date(),
			format: 'yyyy年m月d日'
		}

		var timeOption = {
			container: '#picker_container',
			clear: '',
			format: 'HH:i'
		}

		// スタート画面のフォーム
		var placeDay = $form.find(".place-day").pickadate(dateOption);
		var placeTime = $form.find(".place-time").pickatime(timeOption);
		this.dayPicker = placeDay.pickadate('picker');
		this.timePicker = placeTime.pickatime('picker');
		$form.find(".place-day").on("change", changeDateTime.bind(this, 'date', this.dayPicker));
		$form.find(".place-time").on("change", changeDateTime.bind(this, 'time', this.timePicker));
	}

	RootSearcher["prototype"]["directionsService"] = new google.maps.DirectionsService();
	RootSearcher["prototype"]["directionsDisplay"] = new google.maps.DirectionsRenderer();
	RootSearcher["prototype"]["addPlace"] = addPlace;
	RootSearcher["prototype"]["checkPlace"] = checkPlace;
	RootSearcher["prototype"]["changePlace"] = changePlace;
	RootSearcher["prototype"]["changeDateTime"] = changeDateTime;
	RootSearcher["prototype"]["setDateTime"] = setDateTime;
	RootSearcher["prototype"]["clearForm"] = clearForm;
	RootSearcher["prototype"]["checkForm"] = checkForm;
	RootSearcher["prototype"]["searchRoot"] = searchRoot;

	/**
	 * 目的地を追加
	 * @param {DOMElement} element .place-destination
	 */
	 function addPlace(element) {
	 	var autocomplete = new google.maps.places.Autocomplete(element, this.placesOptions);
	 	var $el = $(element);
	 	google.maps.event.addListener(autocomplete, 'place_changed', changePlace.bind(this, autocomplete, $el));
	 	$el.on("keydown keyup keypress change", checkPlace.bind(this, $el));
	 	this.checkPlace($el);
	 }

	/**
	 * 場所フォームチェック
	 * @param  {String}        type     'from' or 'to'(出発地 or 目的地)
	 * @param  {jQuery Object} $element input要素のjQueryオブジェクト
	 */
	 function checkPlace($element) {
		// 選択済みの場所データから入力フィールドが変更されていれば拒否
		// if (this.searchData[type] && $element.val() !== this.searchData[type].name)
		var value = $.data($element[0], "value");
		if (typeof value !== "undefined" && value !== $element.val())
			$.data($element[0], "searchEnable", false);
		this.checkForm();
	}

	/**
	 * 場所変更(place_changedからの呼び出し)
	 * @param  {String}                          type         'from' or 'to'(出発地 or 目的地)
	 * @param  {google.maps.places.Autocomplete} autocomplete PlacesAutocomplate object
	 */
	 function changePlace(autocomplete, $element) {
	 	var place = autocomplete.getPlace();

		// 場所名をキャッシュ
		$.data($element[0], "value", $element.val());

		if (typeof place.geometry !== "undefined") {
			place.geometry.location.latitude = place.geometry.location.lat();
			place.geometry.location.longitude = place.geometry.location.lng();
			$.data($element[0], "place", place);
			$.data($element[0], "searchEnable", true);
		}
		this.checkForm();
	}

	/**
	 * 日時変更
	 * @param  {String}   type        'date' or 'time'(日 or 時)
	 * @param  {$.picker} picker      値を取得する pickadate or pickatime オブジェクト
	 */
	 function changeDateTime(type, picker) {
		// 日時データをキャッシュ
		this.searchData[type] = picker.get("select");
		// フォームの値を同期
		// $('.when_' + type).val(picker["picka" + type]("get"[0], "value"));
		if (this.searchData[type] !== null)
			this.searchEnable[type] = true;
		this.checkForm();
	}

	/**
	 * Dateを突っ込んでpickerに反映
	 * @param {Date} date JavaScriptのDate型オブジェクト
	 */
	 function setDateTime(date) {
	 	this.dayPicker.set("select", date);
	 	this.changeDateTime('date', this.dayPicker);

	 	this.timePicker.set("select", date);
	 	this.changeDateTime('time', this.timePicker);
	 }

	/**
	 * Dateを突っ込んでpickerに反映
	 * @param {Date} date JavaScriptのDate型オブジェクト
	 */
	 function clearForm() {
	 	this.$form.find('.place-destination:not(:first)').closest('.form-places-group').remove();
	 	this.$form.find(".place-origin, .place-destination").val("");
	 	this.dayPicker.clear();
	 	this.timePicker.clear();
	 	this.changeDateTime('date', this.dayPicker);
	 	this.changeDateTime('time', this.timePicker);
	 	this.searchEnable.date = false;
	 	this.searchEnable.time = false;
	 	this.checkForm();
	 }

	/**
	 * アリバイ作成フォームのチェック
	 */
	 function checkForm() {
	 	var placeEnable = true;
	 	$.each(this.$form.find(".place-origin, .place-destination"), function() {
	 		if ($.data($(this)[0], "searchEnable") !== true)
	 			placeEnable = false;
	 	});
	 	if (placeEnable && this.searchEnable.date && this.searchEnable.time) {
	 		this.$search_root.removeAttr("disabled");
	 	} else {
	 		this.$search_root.attr("disabled", "");
	 	}
	 }

	/**
	 * ルートの検索・描画
	 */
	 function searchRoot(callback) {
	 	var rs = this;

	 	var dests = this.$form.find(".place-origin, .place-destination");
	 	var waypoints = [];
	 	for (var i = 1; i < dests.length - 1; i++) {
	 		var $dest = $(dests[i])
	 		var place = $.data($dest[0], "place");
	 		var location = place.geometry.location;
	 		location.place = {
	 			place_id: place.place_id,
	 			name: place.name,
	 			geometry: {
	 				location: {
	 					latitude: place.geometry.location.latitude,
	 					longitude: place.geometry.location.longitude
	 				}
	 			}
	 		};
	 		location.place_id = place.place_id;
	 		location.value = $.data($dest[0], "value");
	 		waypoints.push({
	 			location: location,
	 			stopover: true
	 		});
	 	}

	 	var $placeOrigin = $(dests[0]);
	 	var placeOrigin = $.data($placeOrigin[0], "place");
	 	var $dest = $(dests[dests.length - 1]);
	 	var placeDest = $.data($dest[0], "place");
	 	var request = {
	 		origin: placeOrigin.geometry.location,
	 		destination: placeDest.geometry.location,
	 		waypoints: waypoints,
	 		optimizeWaypoints: true,
	 		travelMode: google.maps.TravelMode.DRIVING
	 	};
	 	request.origin.place = {
	 		place_id: placeOrigin.place_id,
	 		name: placeOrigin.name,
	 		geometry: {
	 			location:  {
 					latitude: placeOrigin.geometry.location.latitude,
 					longitude: placeOrigin.geometry.location.longitude
 				}
	 		}
	 	};
	 	request.origin.value = $.data($placeOrigin[0], "value");
	 	request.destination.place = {
	 		place_id: placeDest.place_id,
	 		name: placeDest.name,
	 		geometry: {
	 			location:  {
 					latitude: placeDest.geometry.location.latitude,
 					longitude: placeDest.geometry.location.longitude
 				}
 	 		}
	 	};
	 	request.destination.value = $.data($dest[0], "value");

	 	var departure = new Date((parseInt(rs.searchData.date.obj.getTime() / 1000) + rs.searchData.time.time * 60) * 1000);

	 	rs.directionsService.route(request, function(result, status) {
	 		if (status == google.maps.DirectionsStatus.OK) {
	 			var arrival = departure.getTime();
	 			for (var i = 0; i < result.routes.length; i++) {
	 				// パース用データを保存
	 				var sw = result.routes[i].bounds.getSouthWest();
	 				var ne = result.routes[i].bounds.getNorthEast();
	 				result.routes[i].bounds = {
	 					sw: {
	 						latitude: sw.lat(),
	 						longitude: sw.lng()
	 					},
	 					ne: {
	 						latitude: ne.lat(),
	 						longitude: ne.lng()
	 					}
	 				}
	 				for (var j = 0; j < result.routes[i].legs.length; j++) {
	 					arrival += result.routes[i].legs[j].duration.value * 1000;

	 					// パース用データを保存
						var leg = result.routes[i].legs[j];
						result.routes[i].legs[j].start_location = {
							latitude: leg.start_location.lat(),
							longitude: leg.start_location.lng()
						};
						result.routes[i].legs[j].end_location = {
							latitude: leg.end_location.lat(), 
							longitude: leg.end_location.lng()
						};
						for (var k = 0; k < result.routes[i].legs[j].steps.length; k++) {
							for (var l = 0; l < result.routes[i].legs[j].steps[k].path.length; l++) {
								var path = result.routes[i].legs[j].steps[k].path[l];
								result.routes[i].legs[j].steps[k].path[l] = {
									latitude: path.lat(),
									longitude: path.lng()
								};
							}
						}
	 				}
	 				arrival += 3600000 * (result.routes[i].legs.length - 1);
	 			}
	 			result.arrival = arrival;

	 			callback.call(null, result, departure);
	 		}
	 	});
	 }

	/**
	 * 与えられたPlaceのポップアップ用の情報を取得
	 * @param  {google.maps.places.PlaceResult} place ポップアップするPlace
	 */
	 function loadPlacesContent(place,result) {
	 	var popup = this;
	 	var request = {
	 		placeId: place.place_id
	 	};
	 	var placesService = new google.maps.places.PlacesService(popup.map);
	 	var content = '';
	 	placesService.getDetails(request, function(details, status) {
	 		if (status == google.maps.places.PlacesServiceStatus.OK) {
			 	content += '<h3>' + details.name + '</h3>';

			 	var response;
			 	$.getJSON("https://api.flickr.com/services/rest?method=flickr.photos.search&api_key=f51d23964bce3d29afd14807431a3dd4&text="+details.name+"&format=json&nojsoncallback=1&is_common=true",function(response){
			 	})
			 	.done(function(response){
			 		content += '<div class="popup__photocontainer">';
			 		for(var i = 0; i < response.photos.total && i < 3;i++){
			 			var url = "http://farm"+response.photos.photo[i].farm+".static.flickr.com/"+response.photos.photo[i].server+"/"+response.photos.photo[i].id+"_"+response.photos.photo[i].secret+"_m.jpg";
	                    content += '<div class="popup__photowrapper"><div class="popup__photospacer"><div class="photo__thumbnail"><div style="background-image: url(\''+url+'\');" class="popup__photo"></div></div></div></div>';
			 		}
			 		content += '</div>';
			 	});

			 	if (details.reviews) {
			 		var reviewTexts = "";
			 		for (var i = 0; i < details.reviews.length; i++) {
			 			reviewTexts += details.reviews[i].text;
			 		}

			 		for (var i = 0; i < details.reviews.length && i < 3; i++) {
			 			content += '<p>' + details.reviews[i].text + '</p>';
			 		}
			 	}
			 	var sendText = {
			 		content: reviewTexts
			 	}
			 	$.post("/make_suggestion",sendText,function(data){
			 	})	
			 	.done(function(data){
			 		var time = new Date(place.duration);
			 		var alibi = $(".alibi-collapse.in");

			 		alibi = $.data(alibi[0], "id");
			 		content += '<div class="form-group">予定時刻: <time>'+time.getFullYear()+'年'+(time.getMonth() + 1)+'月'+time.getDate()+'日 '+("0"+time.getHours()).slice(-2)+':'+("0"+time.getMinutes()).slice(-2)+'</time><textarea id="nobuki" class="form-control" rows="3" maxlength="140">'+data+'</textarea></div><button type="button" id="tweetbut" class="btn btn-info btn-lg btn-block">Tweet予約</button>';
			 		content += '</div>';
			 		var doc= $(".tweetbut");
			 		var tj = new Date((place.duration));

			 		popup.content = content;
			 		popup.$popover.one("tap", "#tweetbut", function(){
			 			var t =document.getElementById('nobuki').value;
			 			var sendData ={ali: alibi, tim: tj, text: t, lng: place.geometry.location.lng(), lat: place.geometry.location.lat(), name: place.name};

			 			$.post("/add_tweet",sendData, function(id) {
			 				$("#map").trigger("tap");
			 				var data = {
			 					twidt: new Date(place.duration),
			 					twict: t,
			 					name: place.name,
			 					id: id
			 				}
			 				popup.loadContent = akihikoPlacesContent.bind(popup, data)
			 			});
			 		});
				});	
		 	}
		});
	}

	function akihikoPlacesContent(twi) {
	 	var popup = this;

	 	var content = '<h3>'+twi.name+'</h3>';
	 		content += '<div class="form-group">予定時刻: <time>'+twi.twidt.getFullYear()+'年'+(twi.twidt.getMonth() + 1)+'月'+twi.twidt.getDate()+'日 '+("0"+twi.twidt.getHours()).slice(-2)+':'+("0"+twi.twidt.getMinutes()).slice(-2)+'</time><textarea id="nobuki" class="form-control" rows="3" maxlength="140">'+twi.twict+'</textarea></div>';
	 		content += '<div class="row"><div class="col-xs-6" style="padding-right: 5px;"><button id="update_twi" type="button" class="btn btn-primary btn-block btn-lg">変更</button></div> <div class="col-xs-6" style="padding-left: 5px;"><button id="delete_twi" type="button" class="btn btn-danger btn-block btn-lg">削除</button></div></div>'
	 		content += '</div>';
	 	var doc= $(".tweetbut");

		popup.content = content;
		popup.$popover.one("tap", "#delete_twi", function(){
			$.get("/delete_tweet",{id: twi.id}, function() {
				$("#map").trigger("tap");
				popup.$popover.one("contracted", function() {
					popup.setMap(null);
				});
			});
		});
		popup.$popover.on("tap", "#update_twi", function(){
			var data = {
				id: twi.id,
				tim: twi.twidt,
				text: popup.$popover.find("#nobuki").val()
			}
			twi.twict = data.text;

			$.post("/update_tweet", data, function() {
			});
		});
	}

	/**
	 * 地図上にクリックすると拡大するポップアップを表示(InfoWindow代替)
	 * prototype.loadContentで拡大後のコンテンツを非同期読み込みするように実装してください。
	 * @param {google.maps.Map}    map     Mapオブジェクト
	 * @param {google.maps.LatLng} latlng  吹き出しの出る座標
	 * @param {String}             content 中身(縮小時)
	 */
	 function ExpandablePopup(map, latlng, content) {
	 	this.setMap(map);
	 	this.latlng = latlng;
	 	this.content = content;
	 }

	// Inheritance + Implementation
	ExpandablePopup['prototype'] = new google.maps.OverlayView();
	ExpandablePopup['prototype']['onAdd'] = expandablePopupOnAdd;
	ExpandablePopup['prototype']['draw'] = expandablePopupDraw;
	ExpandablePopup['prototype']['onRemove'] = expandablePopupOnRemove;

	// Extention
	ExpandablePopup['prototype']['modifyExpandedPopupSize'] = modifyExpandedPopupSize;
	ExpandablePopup['prototype']['applyModifiedExpandedPopUpSize'] = applyModifiedExpandedPopUpSize;
	ExpandablePopup['prototype']['initContent'] = initContent;
	ExpandablePopup['prototype']['loadContent'] = loadContent;

	/**
	 * google.maps.OvarlayView.onAdd()の実装
	 */
	 function expandablePopupOnAdd() {
	 	var panes = this.getPanes();
	 	
	 	this.$popover = $('<div class="expop popover top fade in show" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>');
	 	$(panes.floatPane).append(this.$popover);
	 	this.initContent();

	 	this.$popover.one('tap', expandExpandablePopup.bind(this)).on('tap', function(e) {
	 		e.stopPropagation();
	 	});

	 	this.$popover.on({
	 		tap: function() {
	 			$(this).trigger("focus");
	 		},
	 		doubletap: function() {
	 			$(this).trigger("select");
	 		}
	 	}, "textarea, input");
	 }

	/**
	 * google.maps.OvarlayView.draw()の実装
	 * 吹き出しの場所を修正
	 */
	 function expandablePopupDraw() {
	 	this.point = this.getProjection().fromLatLngToDivPixel(this.latlng);
	 	this.$popover.css({
	 		left: this.point.x - this.width / 2,
	 		top: this.point.y - this.height - 11
	 	});
	 }

	/**
	 * google.maps.OvarlayView.onRemove()の実装
	 * expandablePopupOnAdd.setMap(null)で実行
	 */
	 function expandablePopupOnRemove() {
	 	this.$popover.remove();
	 }

	/**
	 * 拡張時のサイズ設定
	 * @param  {boolean} applicable 後から自分で適応する場合false
	 */
	 function modifyExpandedPopupSize(applicable) {
	 	var m = $("#map");
	 	var mw = m.width();
	 	var mh = m.height();

	 	if (mw > 767) {
	 		mw = 768;
	 	}

	 	this.height = mh - 55 - 40 - 10;
	 	this.width = mw - 40 - 10;
	 	if (applicable)
	 		this.applyModifiedExpandedPopUpSize();

	 	var prj = this.getProjection();
	 	var pixel = prj.fromLatLngToDivPixel(this.latlng);
	 	pixel.y -= this.height / 2;
	 	this.map.panTo(prj.fromDivPixelToLatLng(pixel));
	 }

	/**
	 * ポップアップのサイズ変更を適用
	 */
	 function applyModifiedExpandedPopUpSize() {
	 	this.$popover.css({
	 		width: this.width,
	 		height: this.height
	 	});
	 	this.draw();
	 }

	/**
	 * 縮小時の中身の設定
	 * @param {String} content 中身
	 */
	 function initContent(content) {
	 	if (content && typeof content !== "undefined")
	 		this.content = content;

	 	this.$popover.find('.popover-content').html(this.content);
	 	this.width = this.$popover.outerWidth();
	 	this.height = this.$popover.outerHeight();
	 	this.$popover.css({
	 		width: this.width,
	 		height: this.height
	 	});

	 	this.draw();
	 }

	/**
	 * 非同期読み込みを実装してください
	 * @return {String} 拡大後の中身
	 */
	 function loadContent() {
		// 継承先かインスタンスで実装してください。
		this.content = this.content;
	}

	function expandExpandablePopup() {
		var popup = this;
		var $popover = popup.$popover;
		var tmpWidth = popup.width;
		var tmpHeight = popup.height;
		var tmpCenter = popup.map.getCenter();
		var tmpContent = popup.content;

		popup.loadContent();

		popup.modifyExpandedPopupSize(false);

		popup.map.setOptions({
			draggable: false,
			scrollwheel: false
		});

		$popover.addClass('popup--moving');

		var resize = google.maps.event.addDomListener(window, "resize", modifyExpandedPopupSize.bind(popup, true));
		google.maps.event.addListenerOnce(popup.map, 'idle', function() {
			popup.applyModifiedExpandedPopUpSize();
			$popover.css({
				zIndex: "+=1"
			}).addClass('popup--expanded').removeClass('popup--moving').delay(800).queue(function() {
				$popover.find('.popover-content').transition({
					opacity: 0
				}, 'fast', function() {
					$popover.find('.popover-content').html('<div class="_scroll">' + popup.content + '</div>').transition({
						opacity: 1
					}, 'fast');
				});

				$("#map").one("tap", contractExpandablePopup.bind(popup, tmpWidth, tmpHeight, tmpCenter, tmpContent, resize));
				$popover.dequeue();
			});
		});
	}

	/**
	 * ポップアップを元のサイズに戻す
	 * @param  {Number} width   元の幅
	 * @param  {Number} height  元の高さ
	 * @param  {Number} center  元の中心
	 * @param  {String} content 元の中身
	 */
	 function contractExpandablePopup(width, height, center, content, resize) {
	 	var popup = this
	 	var $popover = popup.$popover;
	 	var $popoverContent = $popover.find('.popover-content');
	 	popup.width = width;
	 	popup.height = height;
	 	popup.content = content;

	 	var ev = new $.Event("contracted", this.$popover);

	 	$popoverContent.transition({
	 		opacity: 0
	 	}, 'fast', function() {
	 		popup.map.panTo(center);
	 		$popover.css({
	 			height: height,
	 			width: width,
	 			zIndex: "-=1"
	 		}).removeClass('popup--expanded');
	 		popup.draw();
	 		$popoverContent.html(content).transition({
	 			opacity: 1
	 		}, 'fast');
	 		$popover.one('tap', expandExpandablePopup.bind(popup));
	 		popup.map.setOptions({
	 			draggable: true,
	 			scrollwheel: true
	 		});
	 		$popover.trigger(ev);
	 	});

	 	google.maps.event.removeListener(resize);
	 }

	// Exports
	if ("process" in global) {
		module["exports"] = Ittekiter;
	}
	global["Ittekiter"] = Ittekiter;

})((this || 0).self || global);

/**
 * main
 */

 $(function() {
 	var ittekiter = new Ittekiter();

 	ittekiter.setSize();
 	ittekiter.setEvent();

 	var timer = false;
 	$(window).on("orientationchange resize", function() {
 		if (timer !== false) {
 			clearTimeout(timer);
 		}
 		timer = setTimeout(function() {
 			ittekiter.setSize();
 		}, 200);
 	});
 });

/**
 * タッチスクロール用の制御
 * ページ全体ではなく、一部のみスクロールさせたい時
 * _scrollクラスつけた要素内がスクロール可能
 * 親要素のHeightの指定が必要
 */
 $(document).on({
 	touchstart: function(e) {
 		$.data(this, "touchStart", {
 			x: e.originalEvent.changedTouches[0].pageX,
 			y: e.originalEvent.changedTouches[0].pageY
 		});
 	},
 	touchmove: function(e) {
 		var start = $.data(this, "touchStart");
 		start.scrolling = start.scrolling || Math.abs(e.originalEvent.changedTouches[0].pageY - start.y) - Math.abs(e.originalEvent.changedTouches[0].pageX - start.x);
 		if (start.scrolling > 0 && !$(this).hasClass('disable_scroll')) {
 			var stopProp = this.scrollTop ? this.scrollHeight - this.offsetHeight - this.scrollTop ? true : e.originalEvent.changedTouches[0].pageY >= start.y : this.scrollHeight - this.offsetHeight ? e.originalEvent.changedTouches[0].pageY <= start.y : false;

 			if (stopProp) {
 				e.stopImmediatePropagation();
 			} else {
 				$(this).css({
 					y: (e.originalEvent.changedTouches[0].pageY - start.y) / 2.5
 				});
 			}
 		}
 		$.data(this, "touchStart", start);
 	},
 	touchend: function(e) {
 		$(this).transition({
 			y: 0
 		});
 		$.removeData(this, "touchStart");
 	},
 	touchcancel: function(e) {
 		$(this).transition({
 			y: 0
 		});
 		$.removeData(this, "touchStart");
 	}
 }, "._scroll");