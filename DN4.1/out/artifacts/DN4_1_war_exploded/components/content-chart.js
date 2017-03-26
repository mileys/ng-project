/**
 * Copyright (c) 2007-2014, InHand Networks All Rights Reserved.
 * @author qinjunwen
 * see /DeviceNetwork/src/main/webapp/test/cloud/components/contentchart.html
 */
define(function(require) {
    var cloud = require("cloud/base/cloud");
    require("cloud/lib/plugin/jquery.layout");
    var Button = require("cloud/components/button");
    var Chart = require("cloud/components/chart");
    require("./content-chart.css");
    require("cloud/lib/plugin/jquery.datetimepicker");
//    var html = require("text!./content-chart.html");
    
    var ContentChart = Class.create(cloud.Component, {
        
        /**
         * init this component
         * @author QinJunwen
         * @param $super {Function} parent method
         * @param options
         */
        initialize: function($super, options) {
            this.moduleName = "content-chart";
            cloud.util.defaults(options, {
            	fixedAxis : false,
            	chart : {
            		type : "line",//"line", "spline", "column"
            		title : "title",
            		tooltips : {
            			formatter : null,
            			prefix : "",
            			subfix : ""
            		},
            		xAxis : {
            			title : "xAxis",
            			formatter : null
            		},
            		yAxis : {
            			"title" : "yAxis",
            			formatter : null,
            			unit : ""
            		}
            	}
			});
            $super(options);
            this.elements = {
            	content : this.id + "-content", 
                toolbar: this.id + "-toolbar",
                chart: this.id + "-chart",
                startTime:this.id + "-starttime",
                endTime:this.id + "-endtime"
            };
            this.seriesArr = $A();
            
            this.draw();
            
            this._initParams();
        },
        
        /**
         * draw this component
         * @author QinJunwen
         */
        draw : function(){
        	this._drawHtml();
        	this._drawToolbar();
        	this._drawContent();
        },
        
        /**
         * initialize the interval/ startTime / endTime
         */
        _initParams : function(){
//        	if (!this.interval){
//        		if (this.options.intervalButtons && this.options.intervalButtons.length > 0){
//            		this.interval = this.options.intervalButtons[0].value;
//            	}else{
//            		this.interval = 24 * 3600;
//            	}
//        	}
//        	
//        	var interval = parseInt(this.interval);
//        	var nowTimeInSec = Math.round(new Date()/1000);
//        	if (interval != 0){
//        		this.startTime = nowTimeInSec - interval;
//            	this.endTime = nowTimeInSec;
//        	}else{
//        		this.startTime = 0;
//            	this.endTime = 0;
//        	}
        },
        
        /**
         * draw html content of this component
         * @author QinJunwen
         */
        _drawHtml: function() {
            var html = "<div id=" + this.elements.content + " class='content-chart-content' style='height : 100%; width:100%'>" +
            	"<div id=" + this.elements.toolbar + " class='content-chart-toolbar'></div>" +
                "<div id=" + this.elements.chart + " class='content-chart-chartplugin'></div>" +
                "</div>";
            this.element.css({
            	width : "100%",
            	height : "100%",
            	overflow : "hidden"
            })
            this.element.append(html);
        },
        
        /**
         * draw interval toolbar
         * @author QinJunwen 
         */
        _drawToolbar : function(){
        	var self = this;
        	this.toolbar = $("#" + this.elements.toolbar);
        	var panel = $("<span>").addClass("content-chart-toolbar-panel").appendTo(this.toolbar);
        	var panelLeft = $("<span>").attr("id", this.id + "-tbpannel-left").addClass("content-chart-toolbar-panel-left").appendTo(panel);
        	var panelCenter = $("<span>").attr("id", this.id + "-tbpannel-center").addClass("content-chart-toolbar-panel-center").appendTo(panel);
        	var panelRight = $("<span>").attr("id", this.id + "-tbpannel-right").addClass("content-chart-toolbar-panel-right").appendTo(panel);
        	this.drawDatePicker(panelLeft);
        	this.intervalButtons = $A(this.options.intervalButtons);
        },
        
        /**
         * @author QinJunwen
         * @name drawDatePicker
         * @type {method}
         * @description "绘制日期选择框"
         * @param {object} container "jquery对象"
         * @return
         */
        drawDatePicker : function(container){
            var self = this;
            var inputHtml = "<p style='float:left;line-height: 20px;margin: 0 5px 0 10px;'>"+locale.get({lang:"from"})+"</p>"
            				+"<input style='float:left;width:125px' class='content-chart-toolbar-datepicker datepicker' type='text' readonly='readonly' id="+this.elements.startTime+" />"
            				+"<p style='float:left;line-height: 20px;margin: 0px 5px;'>"+locale.get({lang:"to"})+"</p>"
            				+"<input style='float:left;width:125px' class='content-chart-toolbar-datepicker datepicker' type='text' readonly='readonly' id="+this.elements.endTime+" />";
            container.append(inputHtml);
            this.queryButton = new Button({
                container: container,
                id: "queryBtn",
                text: locale.get({lang:"query"}),
                events: {
                    click: function(){
                    	if((new Date($("#"+self.elements.startTime).val())).getTime() > (new Date($("#"+self.elements.endTime).val())).getTime()){
                    		errorTipDis("time_range_error");
                    		return;
                    	}
                    	var seriesArr = self.seriesArr;
                    	self.removeSeries(seriesArr);
                    	self.addSeries(seriesArr);
                    }
                }
            });
            $("#"+self.elements.startTime).val(cloud.util.dateFormat(new Date(((new Date()).getTime() - 1000 * 60 * 60 * 24 * 7)/1000),"yyyy/MM/dd") + " 00:00").datetimepicker({
				format:'Y/m/d H:i',
				step:1,
				startDate:'-1970/01/08',
				lang:locale.current() === 1 ? "en" : "ch"
			})
			
			$("#"+self.elements.endTime).val(cloud.util.dateFormat(new Date((new Date()).getTime()/1000),"yyyy/MM/dd") + " 23:59").datetimepicker({
				format:'Y/m/d H:i',
				step:1,
				lang:locale.current() === 1 ? "en" : "ch"
			})
        },
        
        /**
         * draw interval selector by intervals
         * @author QinJunwen
         * @param intervalButtons {array} array of object {name:"name", value:"value"}, name to display the option of selector, value to set the interval in second
         * @param container
         */
//        drawSelector : function(intervalButtons, container){
//        	var self = this;
////        	var selector = $("<div>").addClass("paginate-selector").prependTo(this.pager.element.find(".paginate-wrapper"));//TODO
//        	var selectorId = this.id +"-interval-selector";
//        	var selectorHtml = "<select  id='"+ selectorId +"' class='multiselect'>" 
//        	if (intervalButtons && intervalButtons.length > 0){
//        		intervalButtons.each(function(one){
//            		selectorHtml += "<option value='"+ one.value +"' >"+ one.name +"</option>"
//            	})
//        	}else{
//        		selectorHtml += "<option value='"+ 24*3600 +"' selected='selected'> 默认间隔（24小时）</option>"
//        	}
//        	
//        	selectorHtml += "</select>";
//        	$(selectorHtml).appendTo(container || self.toolbar);
//        	require(["cloud/lib/plugin/jquery.multiselect"],function(){
//        		self.intervalSelector = $("#" + selectorId).multiselect({
//        			header: locale.get("time_interval"),
//                	multiple : false,
//                    noneSelectedText: locale.get("time_interval"),
////                    selectedText: "# "+locale.get({lang:"is_selected"}),
//                    selectedList: 1,
//                    minWidth: 130,
//                    height: 120
////                    position : {
////                        my: 'left bottom',
////                        at: 'left top'
////                    }
//                }).on("multiselectclick", function(event, ui){
//                	var value = ui.value;
//                	self.interval = value;
//                	self._initParams();
//                	
//                	if (self.seriesArr.length > 0 ){
//                		self.render();
//                		self.nextIntervalBtn.disable();
//                    	self.previousIntervalBtn.enable();
//                	}else {
//                		self.nextIntervalBtn.disable();
//                    	self.previousIntervalBtn.disable();
//                	}
//                });
//            	
//        	});
//        },
        
        /**
         * resize the chart
         * @author QinJunwen
         * @param width {string} 
         * @param height {string}
         */
        resizeChart : function(width, height){
        	this.content.resize(width, height);
        },
        
        /**
         * draw the chart
         * @author QinJunwen
         */
        _drawContent : function(){
        	var options = this.options;
        	var unit = (options.chart.yAxis && options.chart.yAxis.unit) ? options.chart.yAxis.unit : "";
        	var yAxisFormatter = (options.chart.yAxis && options.chart.yAxis.formatter) ? options.chart.yAxis.formatter : null;
        	var xAxisFormatter = (options.chart.xAxis && options.chart.xAxis.formatter) ? options.chart.xAxis.formatter : null;
        	var tipsFormatter = (options.chart.tooltips && options.chart.tooltips.formatter) ? options.chart.tooltips.formatter : null;
        	this.content = new Chart({
        		container : "#" + this.elements.chart,
        		pluginOpts : {
        			title : {
        				text: options.chart.title
        			},
        			chart: {
		                type: options.chart.type
//		                margin: [50, 50, 120, 80]
		            },
		            tooltip: {
		            	formatter : tipsFormatter,
		                xDateFormat: '%Y-%m-%d %H:%M:%S',
		                valuePrefix : options.chart.tooltips ? options.chart.tooltips.prefix : "",
		                valueSuffix : options.chart.tooltips ? options.chart.tooltips.subfix : ""
//		                shared: true
		            },
		            xAxis: {
		            	title :{
		            		text : options.chart.xAxis ? options.chart.xAxis.title : null
		            	},
		            	dateTimeLabelFormats: {
		                    second: '%H:%M:%S',
		                	minute: '%H:%M',
		                	hour: '%H:%M',
		                	day: '%m-%d',
		                	week: '%m-%d',
		                	month: '%Y-%m',
		                	year: '%Y'
		                },
	                    labels: {
	                    	formatter : xAxisFormatter
	                    },
		            	type : "datetime"
		            },
		            yAxis: {  
		            	max : options.chart.yAxis ? options.chart.yAxis.max : null,
		            	min : options.chart.yAxis ? options.chart.yAxis.min : null,
		            	title :{
		            		text : options.chart.yAxis ? options.chart.yAxis.title : null
		            	},
	                    labels: {
	                        format: '{value}' + unit,
	                        formatter : yAxisFormatter,
	                        step:4
	                    }
	                }/*,
	                legend: {
		                layout: 'vertical',
		                align: 'right',
		                verticalAlign: 'top',
		                x: -10,
		                y: 100,
		                borderWidth: 0
		            }*/
        		}
        	});
        },
        
        /**
         * add series to chart
         * @author QinJunwen
         * @param series {array} array of series to add to chart 
         */
        addSeries : function(series){
        	var self = this;
        	var series = cloud.util.makeArray(series);
        	if (series.length > 0){
        		var chartObj = this.content.getChartObject();
            	series.each(function(one){
            		if (!self.seriesArr.pluck("resourceId").include(one.resourceId)){
                		chartObj.addSeries({
                			id : one.resourceId,
                			name : one.name,
                			step : one.step
                		});
                		self.seriesArr.push(one);
                	}
            	});
            	this.render();
        	}
        },
        
        /**
         * remove series from chart, if arguments is undefined, remove all series.
         * @author QinJunwen
         * @param seriesId {string} id of series to delete
         */
        removeSeries : function(seriesId){
        	var self = this;
        	var seriesIds = $A();
        	if (seriesId){
        		seriesIds = cloud.util.makeArray(seriesId);
        	}else{
        		seriesIds = this.seriesArr.pluck("resourceId");
        	}
        	
        	var chartObj = this.content.getChartObject();
        	seriesIds.each(function(one){
        		var serieObj = chartObj.get(one);
        		serieObj && serieObj.remove();
        		var serie = self.seriesArr.find(function(serOne){
        			if (serOne.resourceId == one){
        				return true;
        			}else{
        				return false;
        			}
        		});
        		self.seriesArr = self.seriesArr.without(serie);
//        		console.log(self.seriesArr , "self.seriesArr ")
        	});
//        	this.render();
        }, 
        
        /**
         * render chart by service, getting data by service from server
         * @author QinJunwen
         */
        render : function(){
        	var self = this;
        	var chartObj = this.content.getChartObject();
        	var service = this.options.service;
        	var startTime = (new Date($("#"+self.elements.startTime).val())).getTime();
        	var endTime = (new Date($("#"+self.elements.endTime).val())).getTime();
        	if ((this.options.fixedAxis) && chartObj){
//        		console.log("setExtremes!!!")
        		chartObj.xAxis[0].setExtremes(startTime, endTime);
        	}
        	service.loadChartByResIds(this.seriesArr.pluck("resourceId"), startTime/1000, endTime/1000, function(result){
        		$A(result).each(function(one){
        			var serie = chartObj.get(one.resourceId);
        			serie && serie.setData(one.data);
        		});
        	}, this)
        },
        
        /**
         * destroy this component
         * @author QinJunwen
         * @param $super {Function} parent method
         */
		destroy: function($super){
			this.content && this.content.destroy();
			this.content = null;
			this.elements = null;
//			this.intervalButtons = null;
//			this.intervalSelector.multiselect("destroy");
//			this.nextIntervalBtn && this.nextIntervalBtn.destroy();
//			this.previousIntervalBtn && this.previousIntervalBtn.destroy();
			this.seriesArr = null;
//			this.startTime = null;
//			this.endTime = null;
			$super();
		}
    });

    return ContentChart;

});