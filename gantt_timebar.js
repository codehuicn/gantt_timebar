// 时间条形图 表格横向、表格纵向、时间条、弹窗
function GanttTimebar(data, opts) {
    this.opts = {
        boxId: '',
        $box: null,
        barType: { // 类型颜色
            'house': 0,
            'hotel': 1,
            'park': 2,
            'business': 3,
            'industry': 4
        },
        barTypeCN: { // 类型中文
            'house': '住宅',
            'hotel': '旅馆',
            'park': '公园',
            'business': '商业圈',
            'industry': '工业园'
        },
        colors: [ // 时间条形图的颜色  背景色和边框色
            ['#f6ffed', '#b7eb8f'],
            ['#e6f7ff', '#91d5ff'],
            ['#fffbe6', '#ffe58f'],
            ['#fff1f0', '#ffa39e'],
            ['#f0f1ff', '#9ea3ff'],
            ['#ffe5eb', '#ff7c9c'],
            ['#d1f4f4', '#59a9a8'],
        ],
        barDrag: true,
        timeMin: '',
        timeMax: '',
        yearArr: [],
        monthArr: [],
        renderType: 'month', // 按照月份显示
        saveData: null,  // 发送用户新增的数据
        saveDataSwitch: false,
        deldata: null,  // 用户删除数据
        delDataSwitch: false,
        $egg: null,  // 弹窗类的对象集合
    }
    this.data = data;
    $.extend(this.opts, opts);
    this.load();
}

// 初始化
GanttTimebar.prototype.load = function () {
    this.opts.$box = $('#' + this.opts.boxId)
    var $box = this.opts.$box
    if ($box.length === 0) {
        console.error('配置参数 boxId 有误');
        return;
    }
    if (!this.data.length) return;

    // 基本元素
    var html = '<div class="ant-table ant-table-large ant-table-fixed-header select-none"><div class="ant-table-content"><div class="ant-table-scroll cursor-hand"><div class="ant-table-header" style="margin-bottom: -17px; padding-bottom: 0px;"><table class="ant-table-fixed" style="width: 820px;"><colgroup></colgroup><thead class="ant-table-thead"><tr></tr><tr></tr></thead></table></div><div class="ant-table-body" style="overflow: scroll;margin-bottom: -17px;"><div class="egg-position" style="width: 820px;"><table class="ant-table-fixed"><colgroup></colgroup><tbody class="ant-table-tbody"></tbody></table></div></div></div><div class="ant-table-fixed-left"><div class="ant-table-header"><table class="ant-table-fixed"><colgroup><col style="width: 103px; min-width: 103px;"></colgroup><thead class="ant-table-thead"><tr><th style="height: 51px;" class="change_type cursor-pointer">按年份显示</th></tr></thead></table></div><div class="ant-table-body-outer" style="margin-bottom: -17px; padding-bottom: 0px;"><div class="ant-table-body-inner" style="overflow: scroll;"><table class="ant-table-fixed"><colgroup><col style="width: 103px; min-width: 103px;"></colgroup><tbody class="ant-table-tbody"></tbody></table></div></div></div></div></div><div class="egg-form" title="增加一个业态" style="display:none"><p class="validateTips">请填写以下内容</p><form><fieldset><label for="param_type">业态类型</label><select name="param_type" id="param_type"><option value="house">住宅</option><option value="hotel">旅馆</option><option value="park" selected="selected">公园</option><option value="business">商场</option><option value="industry">工业园</option></select><label for="param_name">业态名称</label><input type="text" name="param_name" id="param_name" value="" class="text ui-widget-content ui-corner-all"><label for="param_start">开始时间</label><input type="text" name="param_start" id="param_start" value="" class="text ui-widget-content ui-corner-all"><label for="param_end">结束时间</label><input type="text" name="param_end" id="param_end" value="" class="text ui-widget-content ui-corner-all"><!-- Allow form submission with keyboard without duplicating the dialog button --><input type="submit" tabindex="-1" style="position:absolute; top:-1000px"></fieldset></form></div>';
    html = html + '<div id="' + $box.attr('id') + '_confirm" title="通知" style="padding:1.5em 1em;display:none;text-align:center;"><p class="validateTips"></p></div>';
    html = html + '<div id="' + $box.attr('id') + '_alert" title="通知" style="padding:1.5em 1em;display:none;text-align:center;"><p class="validateTips"></p></div>';
    $box.html(html)

    $box.find('.ant-table-fixed-left .ant-table-thead th').html(this.opts.renderType === 'month' ? '按年份显示' :
        '按月份显示');
    $box.find('.egg-form').attr('data-bind', $box.attr('id'));

    // 弹窗对象的获取
    var $dialog = $('.egg-form[data-bind=' + $box.attr('id') + ']'), $form = $dialog.find("form"),
        $paramType = $form.find("#param_type"), $paramName = $form.find("#param_name"), 
        $paramStart = $form.find("#param_start"), $paramEnd = $form.find("#param_end"),
        $allFields = $paramType.add($paramName).add($paramStart).add($paramEnd);
    this.opts.$egg = {
        $dialog: $dialog,
        $confirm: $('#' + $box.attr('id') + '_confirm'),
        $alert: $('#' + $box.attr('id') + '_alert'),
        $form: $form,
        $paramType: $paramType,
        $paramName: $paramName,
        $paramStart: $paramStart,
        $paramEnd: $paramEnd,
        $allFields: $allFields
    }

    this.dealDataTime();
    this.setTableBase();
    this.setTableWidth();
    this.setTableHeight();
    this.getTimebar();
    this.setDialog();
    this.initBinding();
}

// 表格横向，时间条，重新创建
GanttTimebar.prototype.changeTableWidth = function () {
    this.dealDataTime();
    this.setTableBase();
    this.setTableWidth();
    this.getTimebar();
}

// 表格横向，表格纵向，时间条，重新创建
GanttTimebar.prototype.changeTable = function () {
    this.dealDataTime();
    this.setTableBase();
    this.setTableWidth();
    this.setTableHeight();
    this.getTimebar();
}

// 绑定事件
GanttTimebar.prototype.initBinding = function () {
    var that = this,
        $box = this.opts.$box;        

    // tooltip 初始化
    $box.find(".ant-table").tooltip({
        track: true
    });

    // 元素拖拽的位置变化
    that.addDragFn();

    // 切换显示方式
    $box.on('click', '.change_type', function () {
        if (that.opts.renderType === 'month') {
            that.opts.renderType = 'year';
            that.changeTable();
        } else {
            that.opts.renderType = 'month';
            that.changeTable();
        }
    })

    // 滚动同步
    $box.find('.ant-table-scroll .ant-table-header').scroll(function (e) {
        $(this).children().css('left', 0);
        if (!$(this).data('scrollLeft')) {
            $(this).data('scrollLeft', true)
        } else {
            $box.find('.ant-table-scroll .ant-table-body').scrollLeft($(this).scrollLeft())
                .data('scrollLeft', false).children().css('left', 0)
        }
    }).data('scrollLeft', true)
    $box.find('.ant-table-scroll .ant-table-body').scroll(function (e) {
        $(this).children().css('left', 0);
        if (!$(this).data('scrollLeft')) {
            $(this).data('scrollLeft', true)
        } else {
            $box.find('.ant-table-scroll .ant-table-header').scrollLeft($(this).scrollLeft())
                .data('scrollLeft', false).children().css('left', 0)
        }
        if ($(this).data('scrollTop')) {
            $box.find('.ant-table-fixed-left .ant-table-body-inner').scrollTop($(this).scrollTop())
                .data('scrollTop', false)
        } else {
            $(this).data('scrollTop', true)
        }
    }).data({
        'scrollLeft': true,
        'scrollTop': true
    })
    $box.find('.ant-table-fixed-left .ant-table-body-inner').scroll(function (e) {
        if ($(this).data('scrollTop')) {
            $box.find('.ant-table-scroll .ant-table-body').scrollTop($(this).scrollTop())
                .data('scrollTop', false)
        } else {
            $(this).data('scrollTop', true)
        }
    }).data('scrollTop', true)

    // 设置元素拖拽
    $box.find('.ant-table-scroll').drag({
        callDown: function (e) { 
            e.preventDefault();
            if ($(e.target).parent().hasClass('egg-position-bar')) return false;
        },
        callUp: function (e) {
            e.preventDefault();
            $(document).off('mouseup')
        },
        callMove: function (dx, dy, e) { 
            e.preventDefault();
            $(this).find('.ant-table-body').scrollLeft(
                $(this).find('.ant-table-body').scrollLeft() - dx
            );
        }
    })
    $box.find('.ant-table-scroll .ant-table-body').scroll(function () {
        that.scrollEffect($box.find('.ant-table-scroll .ant-table-body'));
    });
    that.scrollEffect($box.find('.ant-table-scroll .ant-table-body'));
}

// 弹窗，表单弹窗，确认弹窗，初始化
GanttTimebar.prototype.setDialog = function () {
    var $egg = this.opts.$egg, that = this, $box = this.opts.$box;

    // confirm 弹窗
    $egg.$confirm.dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 350,
        modal: true,
        buttons: [{
            text: "取消",
            icon: "ui-icon-closethick",
            click: function () {
                $egg.$confirm.dialog("close");
            },
        }, {
            text: "确定",
            icon: "ui-icon-check",
            click: function () {
                if (that.opts.delDataSwitch) {
                    that.updateTips('请稍等...', 'confirm');
                    return;
                }
                that.opts.delData($egg.$confirm.data('idDel'));
                that.updateTips('正在处理中...', 'confirm');
                that.opts.delDataSwitch = true;
            },
        }]
    })

    // alert 弹窗
    $egg.$alert.dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 350,
        modal: true,
        buttons: [{
            text: "确定",
            click: function () {
                $egg.$alert.dialog("close");
            },
        }]
    })

    // 表单弹窗                   
    $egg.$dialog.dialog({
        autoOpen: false,
        height: 466,
        width: 350,
        modal: true,
        buttons: [{
            text: "取消",
            icon: "ui-icon-closethick",
            click: function () {
                $egg.$dialog.dialog("close");
            },
        }, {
            text: "确定",
            icon: "ui-icon-check",
            click: function () {
                that.addData();
            },
        }],
        close: function () {
            that.updateTips('请填写以下信息', 'dialog')
            $egg.$form[0].reset();
            $egg.$allFields.removeClass("ui-state-error");
        }
    })
    $egg.$paramType.selectmenu();
    $egg.$paramStart.datepicker({
        onSelect: function (date, obj) {
            $egg.$paramEnd.datepicker("option", {minDate: new Date(date.replace(/\-/g, "/"))})
        }
    })
    $egg.$paramEnd.datepicker()
    $egg.$form.on("submit", function (event) {
        event.preventDefault();
        that.addData();
    });

    // 表单弹窗信息
    that.updateTips('请填写以下信息', 'dialog')

    // 增加业态的分期
    $box.on("click", ".egg-position-btn[data-code=bar-add]", function () {
        var pid, data, dataCode = $(this).parent().attr('data-code');
        pid = dataCode.split('-')[0];
        data = that.searchData(dataCode.split('-')).data;

        $egg.$paramType.selectmenu('destroy')
        $egg.$paramType.html('<option value="' + data.type + '">' + that.opts.barTypeCN[data.type] + '</option>');
        $egg.$paramType.selectmenu()
        $egg.$dialog.data('pid', pid).dialog("open");
    });

    // 增加其它业态
    $box.on("click", ".ant-table-btn[data-code^=type-add]", function () { 
        var pid, data, dataCode = $(this).attr('data-code').split('-'), 
        types = that.opts.barTypeCN, hasType = false;
        
        pid = dataCode[2], data = that.searchData([pid]).data; 
        $egg.$paramType.selectmenu('destroy')
        $egg.$paramType.html(''); 

        if (dataCode[3] !== '0') {
            $egg.$paramType.append('<option value="' + dataCode[3] + '">' + 
                types[dataCode[3]] + '</option>');
        }
        for (var j in types) {
            hasType = false;
            for (var i = 0, len = data.subTypes.length; i < len; i++) {
                if (j === data.subTypes[i]) {
                    hasType = true;
                    break;
                }
            }
            if (!hasType) {
                $egg.$paramType.append('<option value="' + j + '">' + 
                    types[j] + '</option>');
            }
        }
        $egg.$paramType.selectmenu()

        if ($egg.$paramType.find('option').length === 0) {
            that.updateTips('没有新业态可以增加哦', 'alert')
            $egg.$alert.dialog("open"); 
            return;
        } 
        $egg.$dialog.data('pid', pid).dialog("open");
    });

    // 删除业态的分期
    $box.on("click", ".egg-position-btn[data-code=bar-del]", function () {
        var idDel = $(this).parent().attr('data-code').split('-')[1], 
        nameDel = $(this).parent().html();

        that.updateTips('确定删除 “' + nameDel + '” 吗？', 'confirm')
        $egg.$confirm.data({'idDel': [idDel], $target: [$(this).parent()]}).dialog("open"); 
    });

    // 删除业态
    $box.on("click", ".ant-table-btn[data-code^=type-del]", function () {
        var idDel = [], $target = [], nameDel = '', $curTarget = null,
            dataCode = $(this).attr('data-code').split('-'), 
            pid = dataCode[2], type = dataCode[3], data, dataChild = [];

        if (parseInt(type) === 0) {
            that.updateTips('没有业态可以删除哦', 'alert');
            $egg.$alert.dialog('open');
            return;
        }
        data = that.searchData([pid]).data;    
        for (var i = 0, len = data.children.length; i < len; i++) {
            if (data.children[i].type === type) {
                dataChild.push(data.children[i]);
                idDel.push(data.children[i]['id']);

                $curTarget = $('.egg-position-bar[data-code="' + pid + 
                '-' + data.children[i]['id'] + '"]');
                $target.push($curTarget);
                nameDel = nameDel + $curTarget.attr('title') + '，';
            }
        }
        
        that.updateTips('确定删除 “' + nameDel.slice(0, -1) + '” 吗？', 'confirm')
        $egg.$confirm.data({'idDel': idDel, $target: $target}).dialog("open"); 
    });
}

// 元素拖拽的位置变化
GanttTimebar.prototype.addDragFn = function () {
    $.fn.drag = function (callback) {
        $(this).on('mousedown', function (e) {
            var that = this,
                x = e.pageX,
                y = e.pageY,
                stop;
            
            if (callback.callDown) {
                stop = callback.callDown.call(that, e);
            }
            if (stop === false) return;
            $(document).on('mousemove', function (e) {
                var xx = e.pageX;
                var yy = e.pageY;

                if (callback.callMove) {
                    callback.callMove.call(that, xx - x, yy - y, e);
                }
                x = xx;
                y = yy;
            })
            $(document).on('mouseup', function (e) {
                $(document).off('mousemove');

                if (callback.callUp) {
                    callback.callUp.call(that, e);
                }
            })
        })
    }
}

// 提示信息
GanttTimebar.prototype.updateTips = function (t, o) {  
    var $egg = this.opts.$egg;   
    $egg['$'+o].find('.validateTips').html('<i class="ui-icon ui-icon-info"></i> '+t).addClass("ui-state-highlight");
    setTimeout(function () {
        $egg['$'+o].find('.validateTips').removeClass("ui-state-highlight", 1500);
    }, 500);
}

// 验证数据格式
GanttTimebar.prototype.checkLength = function (o, n, min, max) {
    if (o.val().length > max || o.val().length < min) {
        o.addClass("ui-state-error");
        this.updateTips(n + " 的长度要在 " +
            min + " 到 " + max + " 之间。", 'dialog');
        return false;
    } else {
        return true;
    }
}

GanttTimebar.prototype.checkReg = function (o, regexp, n) { 
    if (regexp.test(o.val())) { 
        return true;
    } else {  
        o.addClass("ui-state-error");
        this.updateTips(n, 'dialog');  
        return false;
    }
}

// 提交数据
GanttTimebar.prototype.addData = function () {
    if (this.opts.saveDataSwitch) {
        this.updateTips("请稍等...", 'dialog');
        return false;
    }

    var valid = true, $egg = this.opts.$egg, that = this,
    reg = /^\d{4,4}\-\d{2,2}\-\d{2,2}$/;
        
    $egg.$allFields.removeClass("ui-state-error");
    valid = valid && that.checkLength($egg.$paramName, "业态名称", 2, 20);
    valid = valid && that.checkReg($egg.$paramStart, reg, "开始时间格式错误");
    valid = valid && that.checkReg($egg.$paramEnd, reg, "结束时间格式错误");

    if (valid) {
        that.opts.saveData({
            pid: $egg.$dialog.data('pid'),
            type: $egg.$paramType.val(),
            name: $egg.$paramName.val(),
            start: $egg.$paramStart.val(),
            end: $egg.$paramEnd.val()
        })
        that.updateTips("正在保存数据...", 'dialog')
        this.opts.saveDataSwitch = true;
    }
    return valid;
}

// 更新数据
GanttTimebar.prototype.saveDataLocal = function (data) {
    for (var i = 0, len = this.data.length; i < len; i++) {
        if (parseInt(this.data[i]['id']) === parseInt(data.pid)) {
            this.data[i]['children'].push(data); 
        }
    }
    this.opts.$egg.$dialog.dialog('close');
    this.opts.saveDataSwitch = false;
    this.changeTable();
}

GanttTimebar.prototype.saveDataError = function (msg) {
    this.updateTips(msg, 'dialog')
    this.opts.saveDataSwitch = false;
}

// 删除数据
GanttTimebar.prototype.delDataLocal = function () {
    var $egg = this.opts.$egg, idDel = $egg.$confirm.data('idDel'), 
        $target = $egg.$confirm.data('$target');

    for (var i = 0, len = this.data.length; i < len; i++) {
        for (var j = 0, lenj = this.data[i]['children']['length']; j < lenj; j++) {
            for (var z = 0, lenz = idDel.length; z < lenz; z++) { 
                if (this.data[i]['children'][j]['id'] == idDel[z]) {
                    this.data[i]['children'].splice(j, 1);
                    lenj--;
                    j--;
                    idDel.splice(z, 1);
                    lenz--;
                    z--;
                    break;
                }
            }
        }
    }
    if ($target) {
        for (var i = 0, len = $target.length; i < len; i++) {
            $target[i].remove();
        }
    }
    this.opts.$egg.$confirm.dialog('close');
    this.opts.delDataSwitch = false;
    this.changeTable();
}

GanttTimebar.prototype.delDataError = function (msg) {
    this.updateTips(msg, 'confirm')
    this.opts.delDataSwitch = false;
}

// 滚动效果设置
GanttTimebar.prototype.scrollEffect = function ($target) {
    var leftWidth = $target.scrollLeft();
    var boxWidth = $target.width();
    var rightWidth = $target.find('.ant-table-fixed').outerWidth() - boxWidth - leftWidth;

    $target.parents('.ant-table').removeClass(
        'ant-table-scroll-position-left ant-table-scroll-position-right');
    $target.parents('.ant-table').toggleClass('ant-table-scroll-position-right', rightWidth === 0);
    $target.parents('.ant-table').toggleClass('ant-table-scroll-position-left', leftWidth === 0);
}

// 获取时间的临界点
GanttTimebar.prototype.getTimeLimit = function (data) {
    for (var i = 0, len = data.length; i < len; i++) {
        if (this.opts.timeMin === '') {
            this.opts.timeMin = data[i]['start'];
        } else if (!this.isEarlyTime(this.opts.timeMin, data[i]['start'])) {
            this.opts.timeMin = data[i]['start'];
        }
        if (this.opts.timeMax === '') {
            this.opts.timeMax = data[i]['end'];
        } else if (!this.isEarlyTime(data[i]['end'], this.opts.timeMax)) {
            this.opts.timeMax = data[i]['end'];
        }
        if (data[i]['children']) this.getTimeLimit(data[i]['children'])
    }
}

// 比较时间
GanttTimebar.prototype.isEarlyTime = function (time1, time2) {
    var time1 = new Date(time1.replace(/-/g, '/'));
    var time2 = new Date(time2.replace(/-/g, '/'));
    time1 = time1.getTime();
    time2 = time2.getTime();
    return time1 <= time2;
}

// 获取月份数据和年份数据
GanttTimebar.prototype.getTimeArr = function (yearNum, monthMin, monthMax) {    
    this.opts.yearArr.push([yearNum, monthMax - monthMin + 1])
    for (var i = 0, len = monthMax - monthMin; i <= len; i++) {
        this.opts.monthArr.push([yearNum, monthMin + i]);
    }
}

// 处理数据的时间点
GanttTimebar.prototype.dealDataTime = function () {
    var timeMin = null,
        timeMax = null;

    // 获取时间的临界点
    this.opts.timeMin = '';
    this.opts.timeMax = '';
    this.getTimeLimit(this.data);

    // 获取时间的节点
    timeMin = new Date(this.opts.timeMin.replace(/-/g, '/'));
    timeMax = new Date(this.opts.timeMax.replace(/-/g, '/'));
    this.opts.yearArr = []; 
    this.opts.monthArr = [];
    for (var i = 0, len = (timeMax.getFullYear() - timeMin.getFullYear()); i <= len; i++) {
        if (i === 0) this.getTimeArr(timeMin.getFullYear(), timeMin.getMonth() + 1, 12);
        if (i === len) this.getTimeArr(timeMax.getFullYear(), 1, timeMax.getMonth() + 1);
        if (i > 0 && i < len) this.getTimeArr(timeMin.getFullYear() + i, 1, 12);
    }

    // 获取节点的业态种类
    this.getSubTypes();
}

// 获取节点的业态种类
GanttTimebar.prototype.getSubTypes = function () {
    var data = this.data, type, hasType;
    for (var i = 0, len = data.length; i < len; i++) {
        data[i]['subTypes'] = [];
        for (var j = 0, lenj = data[i]['children']['length']; j < lenj; j++) {
            type = data[i]['children'][j]['type'], hasType = false;

            for (var z = 0, lenz = data[i]['subTypes']['length']; z < lenz; z++) {
                if (type === data[i]['subTypes'][z]) {
                    hasType = true;
                    break;
                }
            }
            if (!hasType) data[i]['subTypes'].push(type);
        }
    }
}

// 表格横向，表格纵向，右侧表格内容区，创建
GanttTimebar.prototype.setTableBase = function () {
    var data = this.data, $body = this.opts.$box.find('.ant-table-scroll .ant-table-tbody');
    $body.html('')
    for (var i = 0, len = data.length; i < len; i++) {
        this.getBodyRow(data[i], $body);
    }
}

// 表格横向，表格纵向，右侧表格每行内容，创建
GanttTimebar.prototype.getBodyRow = function (data, $tbody) {
    var monthArr = this.opts.monthArr,
        yearArr = this.opts.yearArr,
        renderMonth = this.opts.renderType === 'month',
        $tr = null, 
        barBtns = '<td></td>';

    if (data['subTypes']['length'] === 0) {
        $tr = $('<tr data-code="' + data['id'] + '-' + 0 + '"></tr>').appendTo($tbody)        
        for (var i = 0, len = (renderMonth ? monthArr.length : yearArr.length); i <= len; i++) {
            if (i === 0) $(barBtns).appendTo($tr)
            if (i > 0 && renderMonth) $('<td data-code="' + monthArr[i - 1][0] + '-' + monthArr[i - 1][1] +
                '"></td>').appendTo($tr)
            if (i > 0 && !renderMonth) $('<td data-code="' + yearArr[i - 1][0] + '"></td>').appendTo($tr)
        }
    } else {
        for (var j = 0, lenj = data['subTypes']['length']; j < lenj; j++) {
            $tr = $('<tr data-code="' + data['id'] + '-' + data['subTypes'][j] + '"></tr>').appendTo($tbody)
            for (var i = 0, len = (renderMonth ? monthArr.length : yearArr.length); i <= len; i++) {
                if (i === 0) $(barBtns).appendTo($tr)
                if (i > 0 && renderMonth) $('<td data-code="' + monthArr[i - 1][0] + '-' + monthArr[i - 1][1] +
                    '"></td>').appendTo($tr)
                if (i > 0 && !renderMonth) $('<td data-code="' + yearArr[i - 1][0] + '"></td>').appendTo($tr)
            }
        }
    }
}

// 表格纵向，创建
GanttTimebar.prototype.setTableHeight = function () {
    var data = this.data,
        $box = this.opts.$box,
        $body = $box.find('.ant-table-scroll .ant-table-tbody');

    // 表格纵向，左侧表格内容区，创建
    var $leftBody = $box.find('.ant-table-fixed-left .ant-table-tbody').html(''),
        subTypeLen, leftBodyRow;
    for (var i = 0, len = data.length; i < len; i++) {
        subTypeLen = data[i]['subTypes']['length'];
        subTypeLen = subTypeLen === 0 ? 1 : subTypeLen;
        leftBodyRow = '<tr class="ant-table-row"><td style="height:' + (29 * subTypeLen - 9) +
        'px;position:relative;">' + data[i]['name'];

        for (var j = 0; j < subTypeLen; j++) {
            leftBodyRow = leftBodyRow + 
            '<i style="top: ' + (29 * j) + 'px;" class="ant-table-btn left" title="增加" data-code="type-add-' + 
            data[i]['id'] + '-' + (data[i]['subTypes']['length'] > 0 ? data[i]['subTypes'][j] : 0) + '">+</i>' +
            '<i style="top: ' + (29 * j) + 'px;" class="ant-table-btn right" title="删除" data-code="type-del-' + 
            data[i]['id'] + '-' + (data[i]['subTypes']['length'] > 0 ? data[i]['subTypes'][j] : 0) + '">-</i>';
        }
        leftBodyRow = leftBodyRow + '</td></tr>';
        $leftBody.append(leftBodyRow);
    }

    // 设置容器高度
    var bodyHeight = $box.height() - $box.find('.ant-table-scroll .ant-table-thead').outerHeight();
    if ($body.outerHeight() + 18 < bodyHeight) {
        $body.parents('.ant-table-body').css('height', $body.outerHeight() + 18 + 'px');
        $leftBody.parents('.ant-table-body-inner').css('height', $body.outerHeight() + 18 + 'px');
    } else {
        $body.parents('.ant-table-body').css('height', bodyHeight + 'px');
        $leftBody.parents('.ant-table-body-inner').css('height', bodyHeight + 'px');
    }
}

// 表格横向，创建
GanttTimebar.prototype.setTableWidth = function () {
    var monthArr = this.opts.monthArr,
        yearArr = this.opts.yearArr,
        $box = this.opts.$box,
        renderMonth = this.opts.renderType === 'month';

    var $bodyWrap = $box.find('.ant-table-scroll .egg-position'),
        $headerWrap = $box.find('.ant-table-scroll .ant-table-header .ant-table-fixed'),
        bodyWrapWidth = 30 * monthArr.length + 100,
        $headerCols = $box.find('.ant-table-scroll .ant-table-header colgroup'),
        $bodyCols = $box.find('.ant-table-scroll .ant-table-body colgroup'),
        $header2 = $box.find('.ant-table-scroll .ant-table-thead tr').eq(1);

    if (!renderMonth) bodyWrapWidth = 60 * yearArr.length + 100;

    // 表格横向，左侧表格头部，设置高度
    if (!renderMonth) $box.find('.ant-table-fixed-left .ant-table-header th').css('height', '22px')
    else $box.find('.ant-table-fixed-left .ant-table-header th').css('height', '52px')

    // 表格横向，右侧表格col和头部2，创建
    $headerWrap.css('width', bodyWrapWidth + 'px');
    $bodyWrap.css('width', bodyWrapWidth + 'px');

    $headerCols.html('');
    $bodyCols.html('');
    $header2.html('');
    if (!renderMonth) $header2.hide();
    else $header2.show();

    for (var i = 0, len = (renderMonth ? monthArr.length : yearArr.length); i <= len; i++) {
        if (i === 0) {
            $('<col style="width: 100px; min-width: 100px;">').appendTo($headerCols)
            $('<col style="width: 99px; min-width: 99px;">').appendTo($bodyCols)
            if (renderMonth) $('<th></th>').appendTo($header2)
        }
        if (i > 0 && renderMonth) {
            $('<col>').appendTo($headerCols)
            $('<col>').appendTo($bodyCols)
            $('<th>' + monthArr[i - 1][1] + '</th>').appendTo($header2)
        }
        if (i > 0 && !renderMonth) {
            $('<col style="width: 60px; min-width: 60px;">').appendTo($headerCols)
            $('<col style="width: 60px; min-width: 60px;">').appendTo($bodyCols)
        }
    }

    // 表格横向，右侧表格头部1，创建
    var $header1 = $box.find('.ant-table-scroll .ant-table-thead tr').eq(0)
    $header1.html('')
    for (var i = 0, len = yearArr.length; i <= len; i++) {
        if (i === 0) $('<th></th>').appendTo($header1)
        if (i > 0 && renderMonth) $('<th colspan="' + yearArr[i - 1][1] + '">' + (yearArr[i - 1][1] > 1 ? (
            yearArr[i - 1][0] + '年') : ('')) + '</th>').appendTo($header1)
        if (i > 0 && !renderMonth) $('<th>' + yearArr[i - 1][0] + '</th>').appendTo($header1)
    }
    
    // 设置容器宽度
    var boxWidth = $box.width();
    boxWidth > bodyWrapWidth + 22 ? $box.find('.ant-table').css('width', bodyWrapWidth + 22 + 'px') :
        $box.find('.ant-table').css('width', boxWidth + 'px');
}

// 时间条，创建
GanttTimebar.prototype.getTimebar = function () {  
    var data = this.data,
        barType = this.opts.barType,
        colors = this.opts.colors,
        barDrag = this.opts.barDrag,
        $box = this.opts.$box,
        renderMonth = this.opts.renderType === 'month';
    var bar = {},
        barStart = {},
        barEnd = {},
        barStartOffset = {},
        barEndOffset = {},
        boxOffset = $box.find('.egg-position').offset(),
        $bar = null,
        barBtns = '<i class="egg-position-btn left" title="增加" data-code="bar-add">+</i>' + 
        '<i class="egg-position-btn right" title="删除" data-code="bar-del">-</i>';

    $box.find('.egg-position-bar').remove();
    for (var i = 0, len = data.length; i < len; i++) {
        if (!data[i]['children']) continue;
        for (var j = 0, lenj = data[i]['children']['length']; j < lenj; j++) {
            bar = data[i]['children'][j];  
            barStart = new Date(bar.start.replace(/-/g, '/'));
            barEnd = new Date(bar.end.replace(/-/g, '/'));

            if (!renderMonth) {
                barStartOffset = $box.find('.egg-position tr[data-code="' + data[i]['id'] + '-' + bar.type + '"] td[data-code="' +
                    barStart.getFullYear() + '"]').offset()

                barEndOffset = $box.find('.egg-position tr[data-code="' + data[i]['id'] + '-' + bar.type + '"] td[data-code="' +
                    barEnd.getFullYear() + '"]').offset()
            } else {
                barStartOffset = $box.find('.egg-position tr[data-code="' + data[i]['id'] + '-' + bar.type + '"] td[data-code="' +
                    barStart.getFullYear() + '-' + (barStart.getMonth() + 1) + '"]').offset()

                barEndOffset = $box.find('.egg-position tr[data-code="' + data[i]['id'] + '-' + bar.type + '"] td[data-code="' +
                    barEnd.getFullYear() + '-' + (barEnd.getMonth() + 1) + '"]').offset()
            }

            $bar = $('<div data-code="' + data[i]['id'] + '-' + bar.id + '" style="top: ' + (barStartOffset.top -
                    boxOffset.top + 3) +
                'px;left: ' + (barStartOffset.left - boxOffset.left + (renderMonth ? 3 : (5 * barStart.getMonth() + 5))) +
                'px;width: ' + (barEndOffset.left - barStartOffset.left + (renderMonth ? 26 : (5 * barEnd.getMonth() - 5 * barStart.getMonth()))) +
                'px;background: ' + colors[barType[bar.type]][0] + ';border: 1px solid ' + colors[barType[bar.type]][1] +
                ';" data-show="true" title="' + bar.name + '" class="cursor-pointer egg-position-bar ant-alert ant-alert-no-icon"><span class="ant-alert-message">' +
                bar.name +
                '</span></div>'
            ).appendTo($box.find('.egg-position'))
            $bar.append(barBtns)
            if (parseInt($bar.css('width')) < 5) $bar.css('width', '5px')
            if (!barDrag) $bar.removeClass('cursor-pointer')            
        }
    }

    // 时间条的拖拽
    if (barDrag) this.bindTimebar();
}

// 时间条，拖拽，缩放
GanttTimebar.prototype.bindTimebar = function () {
    var $box = this.opts.$box, that = this, 
        stepLen = this.opts.renderType === 'month' ? 30 : 5;

    $box.find('.egg-position-bar').draggable({
        axis: 'x',
        drag: function (e, ui) {
        },
        start: function (e, ui) { 
            $(this).data('left', parseInt($(this).css('left')));
        },
        stop: function (e, ui) {
            var dx = ui.position.left - $(this).data('left');
            $(this).css('left', $(this).data('left') + stepLen * Math.round(dx /
                stepLen) + 'px')

            that.refreshData(Math.round(dx / stepLen), 'start', $(this).attr(
                'data-code'))
            that.refreshData(Math.round(dx / stepLen), 'end', $(this).attr(
                'data-code'))
            that.checkLimit($(this).attr('data-code'))
        }
    })

    $box.find('.egg-position-bar').resizable({
        handles: 'e, w',
        drag: function (e, ui) {
            if (ui.position.width < stepLen) return false;
        },
        start: function (e, ui) {
            $(this).data({
                left: parseInt($(this).css('left')),
                width: parseInt($(this).css('width'))
            })
        },
        stop: function (e, ui) {
            var leftValue = ui.position.left - $(this).data('left'),
                widthValue = ui.size.width - $(this).data('width'),
                steps = Math.round(widthValue / stepLen);

            $(this).css('width', $(this).data('width') + stepLen * steps);
            if (parseInt($(this).css('width')) < stepLen) {
                $(this).css('width', stepLen);
                steps = Math.round((stepLen - $(this).data('width')) / stepLen);
            }
            if (leftValue) {
                $(this).css('left', $(this).data('left') - stepLen * steps);
                that.refreshData(-steps, 'start', $(this).attr('data-code'))
            } else {
                that.refreshData(steps, 'end', $(this).attr('data-code'))
            }
            that.checkLimit($(this).attr('data-code'))
        }
    })
}

// 更新数据
GanttTimebar.prototype.refreshData = function (steps, type, ids) {
    var dataFind = this.searchData(ids.split('-')),
        yearNum = '',
        monthNum = '',
        dateNum = '',
        dataObj = dataFind.data;
    if (!dataObj[type]) return;

    var timeArr = dataObj[type].split('-')
    yearNum = parseInt(timeArr[0]);
    monthNum = parseInt(timeArr[1]);
    dateNum = parseInt(timeArr[2]);

    monthNum += steps;
    while (monthNum < 1) {
        monthNum += 12;
        yearNum -= 1;
    }
    while (monthNum > 12) {
        monthNum -= 12;
        yearNum += 1;
    }
    this.data[dataFind.index1]['children'][dataFind.index2][type] = yearNum + '-' + monthNum + '-' +
        dateNum;
}

// 检查边界，是否重新渲染
GanttTimebar.prototype.checkLimit = function (ids) {
    var dataFind = this.searchData(ids.split('-')),
        dataObj = dataFind.data;
    if (!dataObj) return;

    var startArr = dataObj.start.split('-'),
        endArr = dataObj.end.split('-');
    this.checkTimeLimit(startArr);
    this.checkTimeLimit(endArr);
}

// 检查时间是否超出，是否重新渲染
GanttTimebar.prototype.checkTimeLimit = function (timeArr) {
    var monthArr = this.opts.monthArr,
        renderMonth = this.opts.renderType === 'month';
    if (
        renderMonth &&
        (this.isEarlyTime(timeArr[0] + '-' + timeArr[1] + '-' + timeArr[2],
                monthArr[0][0] + '-' + monthArr[0][1] + '-' + timeArr[2]) ||
            !this.isEarlyTime(timeArr[0] + '-' + timeArr[1] + '-' + timeArr[2],
                monthArr[monthArr.length - 1][0] + '-' + monthArr[monthArr.length - 1][1] + '-' + timeArr[2]
            ))
    ) {
        this.changeTableWidth();
    }
    if (!renderMonth &&
        (this.isEarlyTime(timeArr[0] + '-' + timeArr[1] + '-' + timeArr[2],
                monthArr[0][0] + '-' + timeArr[1] + '-' + timeArr[2]) ||
            !this.isEarlyTime(timeArr[0] + '-' + timeArr[1] + '-' + timeArr[2],
                monthArr[monthArr.length - 1][0] + '-' + timeArr[1] + '-' + timeArr[2]))
    ) {
        this.changeTableWidth();
    }
}

// 查找数据
GanttTimebar.prototype.searchData = function (idArr) {
    if (idArr.length === 0) return {
        data: null,
        index1: -1,
        index2: -1
    };
    var data = this.data;
    for (var i = 0, len = data['length']; i < len; i++) {
        if (parseInt(data[i]['id']) === parseInt(idArr[0])) {
            if (idArr.length === 1) {
                return {
                    data: data[i],
                    index1: i,
                    index2: -1
                }
            }
            for (var j = 0, lenj = data[i]['children']['length']; j < lenj; j++) {
                if (parseInt(data[i]['children'][j]['id']) === parseInt(idArr[1])) {
                    return {
                        data: data[i]['children'][j],
                        index1: i,
                        index2: j
                    }
                }
            }
            return {
                data: data[i],
                index1: i,
                index2: -1
            }
        }
    }
    return {
        data: null,
        index1: -1,
        index2: -1
    };
}