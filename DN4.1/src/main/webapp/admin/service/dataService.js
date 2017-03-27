

//获取实时数据列表中的变量值
function rt_data(siteId,params,callback, context) {
      schneider.Ajax.request({
            url: "api/site_rt_data/"+siteId,
            type: "GET",
            dataType: "json",
            contentType:"application/json",
            parameters: params,
            success: function(data) {
             callback.call(context || this, data);
       }

});
};
//获取现场下的变量列表
function getSiteVars_list(siteId,params,isAsync,callback,context){
    schneider.Ajax.request({
        url: "api/varslist/"+siteId,
        type: "GET",
        parameters: params,
        async:isAsync,
        success: function(data) {
            callback.call(context || this, data);
        }
    });
}