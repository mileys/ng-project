define(function(require) {
    var scadaTemp = require("./scadaview.html");
    require("cloud/lib/plugin/jquery.layout");
//	require("../../resources/css/jquery-uguide.css");
    var TagScadaView = require("../../pandect/template/tag-scadaview");
    var ContentScadaView = require("../../pandect/components/content-scada");
    var service = require("../../service");
    var AgentCanvasManager = require("../../agent/AgentCanvasManager");
    var editVarForm = require("./var/editVar");
    var _Window = require("cloud/components/window");
    var ScadaTemplate = Class.create(cloud.Component, {
        initialize: function($super, options) {
            $super(options);
            this.elements = {
                imagesdiv: "nts-module-common-canvas-global-resources",
                imagesrc0: "/DeviceNetwork/applications/site/mysite/scada/components/canvas/images/resource/"
            };
            cloud.canvasImages = {};
            this.canvasOptions = {
            };
            this.siteid = options.siteid;
            this.flag1 = $("#get-web-scada").attr("display");//控制现场组态画面没有元素时弹出框的显示
            this.sitename = null;
            this.newScadaData = null;
            this.siteList = null;
            this.selectedScadaId = null;
            this.element.html(scadaTemp);
            this.service = options.service;
            $("#user-footer-toggler").css("display", "none");
            $("#canvas-glasspane").addClass("canvas-glasspane");
            $("#canvas-glasspane").css("display", "none");
            $("#canvas-edit").addClass("canvas-edit");
            this.tagScada = null;
            this.contentScada = null;
            this.render();
            //this.some();
        },
        render: function() {
            this.mask();
            this.rendLayout();
            this.renderContentScadaView();
            this.renderTagScadaView();
            this._renderModelEvent();
            this.renderContentToolbar();

            //this.renderContentEvent();

//			this.renderUguide();
        },
//

        rendLayout: function() {
            if (this.layout) {
                this.layout.destroy();
            }
            this.layout = $("#scadaview-template").layout({
                defaults: {
                    paneClass: "pane",
                    togglerClass: "cloud-layout-toggler",
                    resizerClass: "cloud-layout-resizer",
                    "spacing_open": 1,
                    "spacing_closed": 1,
                    "togglerLength_closed": 50,
                    togglerTip_open: locale.get({lang: "close"}),
                    togglerTip_closed: locale.get({lang: "open"}),
                    resizable: false,
                    slidable: false
                },
                west: {
                    paneSelector: "#tag-scadaview",
                    size: 195
                },
                center: {
                    paneSelector: "#content-scadaview"
                },
                south: {
                    initClosed: true
                }
            });
        },
        renderTagScadaView: function() {
            //this.mark();
            var self = this;
            this.tagScada = new TagScadaView({
                selector: "#tag-scadaview",
                service: this.options.service
            });
        },
        renderContentScadaView: function() {
            this.contentScada = new ContentScadaView({
                selector: "#content-scadaview",
            });
        },
        renderContentEvent: function() {
            this.contentScada.addEvent("click", function(data) {
                //console.log(data);
            });

            this.contentScada.addEvent("mousemoveon", function(data) {
                //console.log(data);
            });

            this.contentScada.addEvent("mousemoveout", function() {
                //console.log("mousemoveout...");
            });
        },
        renderGetRole: function(display) {
            if (permission.app("_scada")["write"]) {
                $("#toolbar-scada-edit-button").show();
                if (display) {
                    $("#canvas-glasspane").css("display", "block");
                    if (this.flag1) {
                        $("#canvas-glasspane").css("display", "none");
                    }
                } else {
                    $("#canvas-glasspane").css("display", "none");
                }
            } else {
                $("#toolbar-scada-edit-button").hide();

                $("#canvas-glasspane").css("display", "none");
            }
        },
        renderContentToolbar: function() {
            var self = this;
            var defaulthtmls = $("<div id='noticeText' style='font-family:Droid Sans, Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;margin-left:50px;'>" + locale.get({lang: 'the_site_has_no_picture'}) + "</div>" +
                    "<div id='dosomething' style='padding-top:20px;margin-left:50px;'>" +
                    "<input type='button' id='newFrame'  value='" + locale.get({lang: 'create_a_new_picture'}) + "' class='toolbar-scada-3-button' />" +
                    "<input type='button' id='copyOtherFrame' value='" + locale.get({lang: 'copy_from_the_other_site'}) + "' class='toolbar-scada-3-button'  style='margin-left:40px;'/>" +
                    "</div>");
            var $scadas = $("<form id='toolbar-search-box' style='width:auto;height:5px'>" +
                    " <label style='margin:auto 10px auto 10px' lang='text:task_state+:'>" + locale.get({lang: 'scada'}) + "</label>" +
                    "<select id='multiselect'></select><span id='split' style='padding-left:10px;margin-right:4px;'>|</span></form>");
            var toolbar = this.contentScada.getContentBoolbar();
            var toolbarLeftElement = "." + $(toolbar["leftDiv"][0]).attr("class");
            $("#" + toolbar.id).find(toolbarLeftElement).before($scadas);
            $("#multiselect").bind('change', function() {
                var selectedId = $("#multiselect").find("option:selected").val();
                self.selectedScadaId = selectedId;
                var canvas = self.contentScada.infoBoard.canvas.dom;
                self.contentScada.infoBoard.sortedDrawables.clear();
                self.contentScada.infoBoard.canvas.ctx2d.clearRect(0, 0, canvas.width, canvas.height);
                var canvasData = self.canvasOptions[selectedId];

                if (canvasData.items.length == 0) {
                    self.contentScada.renderDefaultDiv(true, defaulthtmls);
                } else {
                    self.contentScada.renderDefaultDiv(false);
                }

                self.contentScada.infoBoard.loadData(canvasData);
            });
        },
        //得到点击的坐标
        getEventPosition: function(ev) {
            var x, y;
            if (ev.layerX || ev.layerX == 0) {
                x = ev.layerX;
                y = ev.layerY;
            } else if (ev.offsetX || ev.offsetX == 0) { // Opera
                x = ev.offsetX;
                y = ev.offsetY;
            }
            return {x: x, y: y};
        },
        _renderModelEvent: function() {
            var self = this;
            var varValue = 0;

            //监听canvas的双击事件
            //判断双击的元素   修改变量值
            var cvs = this.contentScada.viewPanel.el.context.firstChild;
            var ctx = cvs.getContext('2d');
            cvs.addEventListener('dblclick', function(e) {
                //当dblclick时运行
                p = self.getEventPosition(e);
                var canvasData = self.contentScada.infoBoard.getData();
                var items = canvasData.items;
                for (var i = 0; i < items.length; i++) {
                    var x = items[i].x;
                    var y = items[i].y;
                    var w = items[i].w;
                    var h = items[i].h;
                    var xp = x + w;
                    var yp = y + h;
                    if ((p.x >= x && p.x <= xp) && (p.y >= y && p.y <= yp)) {
                        if (items[i].a && items[i].a.length > 0 && items[i].writeVarable == true) {

                            self.editVar(items[i].a);
                            break;
                        }
                    }
                }
            }, false);

            this.contentScada.on({
                "editClick": function() {
                    var selectedScadaId = self.selectedScadaId;
                    var siteid = self.siteid;
                    var sitename = self.sitename;
                    var newScadaData = self.newScadaData;
                    var siteList = self.siteList;
                    $("#user-content").empty();
                    $("#canvas-glasspane").css("display", "none");
                    var appUrl = "../../agent/AgentCanvasProperty";
                    cloud.util.setCurrentApp({url: appUrl});   //cloud.platform.
                    if (cloud.platform.currentApplication && Object.isFunction(cloud.platform.currentApplication.destroy)) {
                        cloud.platform.currentApplication.destroy();
                        cloud.platform.currentApplication = null;
                    }
                    this.requestingApplication = appUrl;
                    require(["../../agent/AgentCanvasProperty"], function(Application) {

                        if (cloud.platform.currentApplication && Object.isFunction(cloud.platform.currentApplication.destroy)) {
                            cloud.platform.currentApplication.destroy();
                            cloud.platform.currentApplication = null;
                        }

                        //judge if the previous requesting application is canceled.
                        $("#user-content").empty();
                        cloud.util.unmask("#user-content");
                        if (Application) {
                            cloud.platform.currentApplication = new Application({
                                container: "#user-content",
                                siteid: siteid,
                                sitename: sitename,
                                newScadaData: newScadaData,
                                siteList: siteList,
                                selectedScadaId: selectedScadaId
                            });
                        }
                    }.bind(this));
                },
                "copyFromOther": function() {
                    var siteid = self.siteid;
                    new AgentCanvasManager({
                        siteId: siteid,
                        service: self.service,
                        optionsT: 0
                    });
                },
                "loadData": function() {
                    if (varValue == 0) {
                        varValue = 1;
                    } else if (varValue == 1) {
                        varValue = 0;
                    }
//					var readOnlyDrawables = self.contentScada.infoBoard.readOnlyDrawables;
//
//					for(var i=0;i<readOnlyDrawables.length;i++){
//						var drawable = readOnlyDrawables[i];
//						if(drawable.m) drawable.m.onDataChanage("var id ....");
//					}


                    //获取设备实时数据
                    var canvasData = self.contentScada.infoBoard.getData();
                    var items = canvasData.items;
                    var aliasJson = {};
                    var aliasList = [];
                    var alias_VarId = {};
                    var siteId_alias_varId = {};

                    for (var i = 0; i < items.length; i++) {
                        if (items[i].a && items[i].a.length > 0) {
                            for (var j = 0; j < items[i].a.length; j++) {
                                //zyf====================================================
                                if (items[i].a[j].varId && items[i].a[j].varId.length > 0) {
                                    var var_id = items[i].a[j].varId;
                                    var var_ids = var_id.toString().split("_");

                                    var siteId = var_ids[0];//现场ID
                                    var alias = var_ids[1];//变量别名
                                    var varId = var_ids[2];//变量ID
                                    //for(var k=0 ; k< var_id.length; k++){
                                    alias_VarId[siteId + "_" + alias] = varId;
                                    siteId_alias_varId[siteId + "_" + alias + "_" + varId] = varId;
                                    //}
                                }
                                //zyf==================================================== 
                            }
                        }
                    }
                    for (key in alias_VarId) {
                        var aliasObj = {};
                        aliasObj.siteId = key.split("_")[0];
                        aliasObj.alias = key.split("_")[1];
                        aliasList.push(aliasObj);
                    }
                    aliasJson.devices = aliasList;
                    //批量转换设备列表
                    service.getTransformDevice(aliasJson, function(data) {
                        var deviceAlias = {};
                        //遍历siteId_alias_varId
                        for (key in siteId_alias_varId) {
                            var varId = key.split("_")[2];
                            if (deviceAlias[key.split("_")[1]]) {
                                deviceAlias[key.split("_")[1]].push(varId);
                            } else {
                                deviceAlias[key.split("_")[1]] = [];
                                deviceAlias[key.split("_")[1]].push(varId);
                            }

                        }
                        var deviceList = [];
                        var devicesJson = {};
                        var siteId_alias_varIds = {};
                        if (data.result) {
                            for (var k = 0; k < data.result.length; k++) {
                                var deviceObj = {};
                                var deviceId = data.result[k].deviceId;
                                deviceObj.deviceId = deviceId;

                                var varList = deviceAlias[data.result[k].alias];
                                deviceObj.varIds = varList;

                                deviceList.push(deviceObj);

                                siteId_alias_varIds[deviceId] = data.result[k].siteId + "_" + data.result[k].alias;
                            }
                        }
                        devicesJson.devices = deviceList;
                        var agentDataTime = {};
                        var agentData = {};
                        service.getScadaVarData(devicesJson, function(data) {
                            if (data.result) {
                                for (var j = 0; j < data.result.length; j++) {
                                    var varInfo = data.result[j].vars;
                                    var deviceId = data.result[j].deviceId;
                                    var siteId_alias = siteId_alias_varIds[deviceId];
                                    if (varInfo && varInfo.length > 0) {
                                        for (var ii = 0; ii < varInfo.length; ii++) {
                                            var times = varInfo[ii].endTime ? varInfo[ii].endTime : 0;
                                            agentDataTime[siteId_alias + "_" + varInfo[ii].id] = times;
                                            agentData[siteId_alias + "_" + varInfo[ii].id] = varInfo[ii].value ? varInfo[ii].value : "--";
                                        }
                                    }
                                }
                                if (self.contentScada) {
                                    self.contentScada.updateCanvasValue(agentData, agentDataTime);
                                }
                            }
                        });
                    });
                }
            });

            this.tagScada.scadaTable.dataTable.on({
                "click": function(id, name) {
                    self.mask();
                    self.contentScada.clearDynamicComponentTimer();//清除动态组件的定时器
                    self.siteList = [];
                    var list = [];
                    list.push(id);
                    list.push(name);
                    self.siteList.push(list);

                    var defaulthtmls = $("<div id='noticeText' style='font-family:Droid Sans, Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;margin-left:50px;'>" + locale.get({lang: 'the_site_has_no_picture'}) + "</div>");

                    self.service.getScadaBySiteId(id, function(data) {
                        if (!data.result) {
                            // 清除整个 canvas 画面,将下拉框里的组态画面清空
                            self.siteid = id;
                            self.sitename = name;
                            self.newScadaData = null;
                            //self.contentScada.clearDynamicComponentTimer();//清除动态组件的定时器
                            self.contentScada.clearCanvas();
                            self.contentScada.clearTime();
                            self.contentScada.renderSiteName_div(name);
                            self.contentScada.openCanvasView(null);
                            self.renderCanvasItems(null);

                            self.contentScada.renderDefaultDiv(true, defaulthtmls);
                            self.contentScada.refreshInterval = 10 * 1000;

                            self.renderGetRole(true);
                        } else {
                            var result = data.result;
                            var scadaData = result.content;
                            self.siteid = id;
                            self.sitename = name;
                            self.newScadaData = scadaData;
                            //self.contentScada.clearDynamicComponentTimer();//清除动态组件的定时器
                            self.contentScada.clearCanvas();
                            self.contentScada.clearTime();
                            self.contentScada.renderSiteName_div(name);

                            if (scadaData[0] && scadaData[0].items && scadaData[0].items.length > 0) {
                                if (scadaData[0].refreshInterval) {
                                    self.contentScada.refreshInterval = scadaData[0].refreshInterval * 1000;
                                } else {
                                    self.contentScada.refreshInterval = 10 * 1000;
                                }
                                if (self.contentScada.refreshTimerId) {
                                    window.clearInterval(self.contentScada.refreshTimerId);
                                    self.contentScada.refreshTimerId = null;
                                }
                                self.contentScada.openCanvasView(scadaData);
                            } else {
                                if (self.contentScada.refreshTimerId) {
                                    window.clearInterval(self.contentScada.refreshTimerId);
                                }
                                self.contentScada.refreshInterval = 10 * 1000;
                            }
                            self.renderCanvasItems(scadaData);
                            if (scadaData[0] && scadaData[0].items && scadaData[0].items.length > 0) {
                                self.contentScada.renderDefaultDiv(false);
                                self.renderGetRole(false);
                            } else {
                                self.contentScada.renderDefaultDiv(true, defaulthtmls);
                                self.renderGetRole(true);
                            }



                        }
                        self.unmask();
                    });
                }
            });

            this.tagScada.tagOverview.on({
                click: function(tag) {
                    var self = this;
                    self.mask();
                    this.options.service.getResourcesIds = tag.loadResourcesData;
                    this.tagScada.scadaTable.render(this.options.service, tag, function(data) {
                        if (data.result.length > 0) {
                            self.openSiteCanvasView(data);
                            if (self.contentScada.elements.fullScreenEnabled) {
                                $("#toolbar-all-screen-button").hide();
                                $("#toolbar-exit-screen-button").show();
                            } else {
                                $("#toolbar-exit-screen-button").hide();
                                $("#toolbar-all-screen-button").show();
                            }

                            $("#toolbar-scada-edit-button").show();
                            $("#toolbar-search-box").show();
//                    		$("#notice-bar").css("display","block");
                            self.siteid = null;
                        } else {
                            var name = locale.get({lang: "no_picture"});
                            self.contentScada.clearCanvas();
                            self.contentScada.renderSiteName_div(name);
                            $("#toolbar-all-screen-button").hide();
                            $("#toolbar-exit-screen-button").hide();
                            $("#toolbar-scada-edit-button").hide();
                            $("#toolbar-search-box").hide();
                            self.unmask();
                        }
                    });
                },
                scope: this
            });
        },
        some: function() {
            $("#webscada").click(
                    function() {
                        self.mask();
                        self.contentScada.clearDynamicComponentTimer();//清除动态组件的定时器
                        self.siteList = [];
                        var list = [];
                        list.push(id);
                        list.push(name);
                        self.siteList.push(list);

                        var defaulthtmls = $("<div id='noticeText' style='font-family:Droid Sans, Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;margin-left:50px;'>" + locale.get({lang: 'the_site_has_no_picture'}) + "</div>");

                        self.service.getScadaBySiteId(id, function(data) {
                            if (!data.result) {
                                // 清除整个 canvas 画面,将下拉框里的组态画面清空
                                self.siteid = id;
                                self.sitename = name;
                                self.newScadaData = null;
                                //self.contentScada.clearDynamicComponentTimer();//清除动态组件的定时器
                                self.contentScada.clearCanvas();
                                self.contentScada.clearTime();
                                self.contentScada.renderSiteName_div(name);
                                self.contentScada.openCanvasView(null);
                                self.renderCanvasItems(null);

                                self.contentScada.renderDefaultDiv(true, defaulthtmls);
                                self.contentScada.refreshInterval = 10 * 1000;

                                self.renderGetRole(true);
                            } else {
                                var result = data.result;
                                var scadaData = result.content;
                                self.siteid = id;
                                self.sitename = name;
                                self.newScadaData = scadaData;
                                //self.contentScada.clearDynamicComponentTimer();//清除动态组件的定时器
                                self.contentScada.clearCanvas();
                                self.contentScada.clearTime();
                                self.contentScada.renderSiteName_div(name);

                                if (scadaData[0] && scadaData[0].items && scadaData[0].items.length > 0) {
                                    if (scadaData[0].refreshInterval) {
                                        self.contentScada.refreshInterval = scadaData[0].refreshInterval * 1000;
                                    } else {
                                        self.contentScada.refreshInterval = 10 * 1000;
                                    }
                                    if (self.contentScada.refreshTimerId) {
                                        window.clearInterval(self.contentScada.refreshTimerId);
                                        self.contentScada.refreshTimerId = null;
                                    }
                                    self.contentScada.openCanvasView(scadaData);
                                } else {
                                    if (self.contentScada.refreshTimerId) {
                                        window.clearInterval(self.contentScada.refreshTimerId);
                                    }
                                    self.contentScada.refreshInterval = 10 * 1000;
                                }
                                self.renderCanvasItems(scadaData);
                                if (scadaData[0] && scadaData[0].items && scadaData[0].items.length > 0) {
                                    self.contentScada.renderDefaultDiv(false);
                                    self.renderGetRole(false);
                                } else {
                                    self.contentScada.renderDefaultDiv(true, defaulthtmls);
                                    self.renderGetRole(true);
                                } 
                            }
                            self.unmask();
                        });
                    }
            );
        },
        renderCanvasItems: function(scadaData) {
            var self = this;
            if (scadaData && Ext.isArray(scadaData) && scadaData.length > 0) {
                for (var i = 0; i < scadaData.length; i++) {
                    var data = scadaData[i];
                    self.canvasOptions[data.canvasId] = data;
                    $("#multiselect").append("<option value='" + data.canvasId + "'>" + data.canvasText + "</option>");
                }
                $("#multiselect option").eq(0).attr("selected", true);
                self.contentScada.infoBoard.loadData(scadaData[0]);
                self.selectedScadaId = scadaData[0].canvasId;
            } else if (scadaData) {
                $("#multiselect").append("<option value='" + self.siteid + "'>" + self.sitename + "</option>");
                $("#multiselect").find("option[value=" + self.siteid + "]").attr("selected", true);
                self.canvasOptions[self.siteid] = scadaData;
                self.contentScada.infoBoard.loadData(scadaData);
            } else {
                $("#multiselect").append("<option value='" + self.siteid + "'>" + self.sitename + "</option>");
                $("#multiselect").find("option[value=" + self.siteid + "]").attr("selected", true);
            }

        },
        openSiteCanvasView: function(data) {
            var self = this;
            var self = this;
            if (self.siteid) {
                //返回选中
                var isNotHave = true;
                var totalCount = data.result.length;
                for (var i = 0; i < totalCount; i++) {
                    var el = self.tagScada.scadaTable.dataTable.getRows()[i];
                    var dataRow = self.tagScada.scadaTable.dataTable.getData(el);
                    var rowId = dataRow._id;
                    if (rowId == self.siteid) {
                        self.tagScada.scadaTable.dataTable.getRows()[i].click();
                        isNotHave = false;
                        break;
                    }
                }
                if (isNotHave) {
                    self.tagScada.scadaTable.dataTable.getRows()[0].click();
                }
            } else {
                if (data.result) {
                    self.tagScada.scadaTable.dataTable.getRows()[0].click();
                }
            }
        },
        //修改变量值
        editVar: function(address) {
            var self = this;
//        	var varId = address[0].varId;
//        	console.log("varId",varId);
            var varId = address[0].varId.toString();
            var siteId = varId.split("_")[0];
            var alias = varId.split("_")[1];
            var varId = varId.split("_")[2];

            self.editVarWindow = new _Window({
                container: "body",
                title: locale.get({lang: "var_write_in"}),
                lang: "sdf",
                top: "center",
                left: "center",
                cls: "mydevice-overvier-configMgr",
                height: 300,
                width: 400,
                mask: true,
                drag: true,
                content: "<div id='overview-window-editVar'></div>",
                events: {
                    "onClose": function() {
                        self.editVarWindow = null;
                        self.unmask();
                    },
                    scope: this
                }
            });
            self.editVarWindow.show();
            self.mask();
            this.editVarForm = new editVarForm({
                selector: self.editVarWindow.element.find("#overview-window-editVar"),
                siteList: self.siteList,
                siteId: self.siteid,
                varId: varId,
                alias: alias,
                events: {
                    closeWindow: function(closeType, data) {
                        if (closeType == "edit") {
                            dialog.render({lang: "write_successful"});
                        } else if (closeType == "cancel") {
                        }
                        self.editVarWindow.destroy();
                        self.unmask();
                    },
                    nochangeWindow: function(closeType, data) {
                        if (closeType == "error" || closeType == "timeout") {
                            //获取对话框id的随机数
                            var date = (new Date()).toString().md5();
                            var random = (Math.random()).toString().md5();
                            var element = "#" + "dialog-" + date + random;

                            var $dialog = $("<div>").attr("id", element.substring(1)).attr("class", "inhand-dialog").css({width: "100%", height: 60});
                            var $content = $("<span>").html(data);
                            $content.appendTo($dialog);
                            $dialog.appendTo("body");
                            $(element).dialog({
                                title: locale.get({lang: "prompt", pos: "base"}),
                                buttons: [{text: locale.get({lang: "affirm"}), click: function() {
                                            $(element).dialog("close");
                                        }},
                                    {text: locale.get({lang: "cancel"}), click: function() {
                                            $(element).dialog("close");
                                        }}]
                            });
                        }
                    }
                }
            });
        },
        destroy: function() {
            if (this.layout && (!this.layout.destroyed)) {
                this.layout.destroy();
            }

            if (this.tagScada) {
                this.tagScada.destroy();
                this.tagScada = null;
            }
            if (this.contentScada) {
                this.contentScada.destroy();
                this.contentScada = null;
            }
        }
    });

    return ScadaTemplate;


});
