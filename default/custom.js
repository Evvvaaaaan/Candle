/* Professor-compatible AJAX interface, adapted for the single-document app. */
var baseUrlForAjax = window.CANDLE_BACKEND_CONFIG.baseUrl.replace(/\/$/, '');
var no_more_permission_alert = false;
var candleRefreshRequest = null;
function candleSessionIdentity() {
  return window.CandleBackend?.identity() ?? 0;
}

function isMissingToken(value) {
  return value == null || ['', 'null', 'undefined'].includes(String(value));
}
function listenerGetAccessToken(data) {
  var token = localStorage.getItem('refreshToken');
  var identity = candleSessionIdentity();
  if (
    !candleRefreshRequest ||
    candleRefreshRequest.identity !== identity ||
    candleRefreshRequest.token !== token
  ) {
    var pending = new Promise(function (resolve, reject) {
      if (isMissingToken(token)) {
        reject({ status: 401 });
        return;
      }
      $.ajax({
        url: baseUrlForAjax + '/api/auth',
        method: 'POST',
        headers: { RefreshToken: token },
        contentType: 'application/json; charset=utf-8',
        timeout: 12000,
        success: function (body, status, xhr) {
          if (
            candleSessionIdentity() !== identity ||
            localStorage.getItem('refreshToken') !== token
          ) {
            reject({ status: -1 });
            return;
          }
          var accessToken = xhr.getResponseHeader('Authorization');
          if (isMissingToken(accessToken)) {
            reject({ status: 401 });
            return;
          }
          flutter_setLocalStorage('accessToken', accessToken);
          resolve({ body: body, status: status, xhr: xhr });
        },
        error: function (xhr) {
          reject(
            candleSessionIdentity() !== identity || localStorage.getItem('refreshToken') !== token
              ? { status: -1 }
              : xhr
          );
        },
      });
    });
    candleRefreshRequest = {
      promise: pending,
      identity: identity,
      token: token,
    };
    var cleanup = function () {
      if (candleRefreshRequest?.promise === pending) candleRefreshRequest = null;
    };
    pending.then(cleanup, cleanup);
  }
  candleRefreshRequest.promise.then(
    function (result) {
      if (candleSessionIdentity() !== identity) {
        data.error?.({ status: -1 });
        return;
      }
      data.success(result.body, result.status, result.xhr);
    },
    function (xhr) {
      if (
        candleSessionIdentity() === identity &&
        localStorage.getItem('refreshToken') === token &&
        [401, 403, 406].includes(xhr.status)
      ) {
        flutter_setLocalStorage('refreshToken', null);
        flutter_setLocalStorage('accessToken', null);
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('accessToken');
        window.CandleBackend?.expired();
      }
      data.error?.(xhr, 'error', xhr);
    }
  );
}
function func_ajax(data) {
  if (data.candleIdentity == null) data.candleIdentity = candleSessionIdentity();
  if (data.candleIdentity !== candleSessionIdentity()) {
    data.error?.({ status: -1 });
    return;
  }
  var contentType = data.contentType == null ? 'application/json; charset=utf-8' : false;
  var param =
    data.param == null
      ? null
      : data.type === 'GET'
        ? $.param(data.param)
        : contentType === false
          ? data.param
          : JSON.stringify(data.param);
  var token = localStorage.getItem('accessToken');
  $.ajax({
    url: baseUrlForAjax.replace(/\/$/, '') + data.url,
    type: data.type,
    headers: isMissingToken(token) ? {} : { Authorization: token },
    contentType: contentType,
    data: param,
    cache: false,
    processData: false,
    timeout: 12000,
    success: function (body, status, xhr) {
      if (data.candleIdentity !== candleSessionIdentity()) {
        data.error?.({ status: -1 });
        return;
      }
      data.success?.(body, status, xhr);
    },
    error: function (xhr, status, error) {
      if (data.candleIdentity !== candleSessionIdentity()) {
        data.error?.({ status: -1 });
        return;
      }
      if (xhr.status === 401 && !data.retry && !data.url.startsWith('/api/user/')) {
        data.retry = true;
        access_token(data);
        return;
      }
      if ([401, 403, 406].includes(xhr.status)) window.CandleBackend?.expired();
      data.error?.(xhr, status, error);
    },
  });
}
function access_token(data) {
  listenerGetAccessToken({
    success: function () {
      func_ajax(data);
    },
    error: function (xhr, status, error) {
      data.error?.(xhr, status, error);
    },
  });
}

function readURLFile(input, listener_after_upload) {
  let limit_each_file_size = 10;
  let temp_id = $(input).attr('id') + '';
  if (input.files && input.files[0]) {
    let reader = new FileReader();
    reader.readAsDataURL(input.files[0]);
    reader.onload = function (e) {
      let temp_each_file_size = input.files[0].size / (1024 * 1024);
      if (temp_each_file_size > limit_each_file_size) {
        alert('파일 1개 당 ' + limit_each_file_size + 'mb 용량 제한 초과 입니다!');
        $(input).val('');
        return false;
      }
      let file_type = 'image';
      if (!input.files[0].type.match('image.*')) {
        file_type = 'file';
      } else {
        file_type = 'image';
      }
      listener_upload_file(input.files[0], file_type, listener_after_upload);
    };
  }
}
function listener_upload_file(obj_file, file_type, listener_after_upload) {
  let fileData = new FormData();
  fileData.append('file', obj_file);

  $.ajax({
    url: baseUrlForAjax + '/api/default/uploadFile',
    type: 'POST',
    data: fileData,
    cache: false,
    contentType: false,
    processData: false,
    success: (data, status, xhr) => {
      //alert(xhr.status);
      switch (xhr.status) {
        case 201:
          //alert(data);
          listener_after_upload(file_type, data.url);
          break;
        default:
          console.log('no matching status code');
      }
    },
    error: (data) => {
      alert('error');
    },
  });
}

/* list관련 기능 */
function set_search_sdatefdate(obj, obj_target, obj_func) {
  var temp_d = new Date();
  $('#search_' + obj_target + '_fdate').val(dateToStringFormat(temp_d));

  switch (obj) {
    case 'null':
      $('#search_' + obj_target + '_fdate').val('');
      $('#search_' + obj_target + '_sdate').val('');
      break;
    case 'today':
      $('#search_' + obj_target + '_sdate').val(dateToStringFormat(temp_d));
      break;
    case 'week':
      temp_d.setDate(temp_d.getDate() - 7);
      $('#search_' + obj_target + '_sdate').val(dateToStringFormat(temp_d));
      break;
    case 'month':
      temp_d.setMonth(temp_d.getMonth() - 1);
      $('#search_' + obj_target + '_sdate').val(dateToStringFormat(temp_d));
      break;
  }
  obj_func();
}
function set_search_keyword(obj_target) {
  let search_keyword = $('#search_' + obj_target + '_keyword').val();
  let search_keyword_each = $('.search_' + obj_target + '_keyword_each');
  for (let i = 0; i < search_keyword_each.length; i++) {
    let t_name = $(search_keyword_each[i]).attr('name') + '';
    $(search_keyword_each[i]).val('');
  }
  listener_keyword_changed();

  $('.search_' + obj_target + '_keyword_each').removeClass('hide');
  $('.search_' + obj_target + '_keyword_each').addClass('hide');
  $('.search_' + obj_target + '_keyword_each_' + search_keyword).removeClass('hide');
}
function check_chk(obj_class) {
  let all_checked = true;
  let input_each = $('.' + obj_class + '_each');
  for (let i = 0; i < input_each.length; i++) {
    let each_checked = $(input_each[i]).prop('checked');
    if (each_checked) {
    } else {
      all_checked = false;
    }
  }
  $('.' + obj_class + '_all').prop('checked', all_checked);
}
function check_chk_delete() {
  check_chk('input_chk_delete');
}
function listener_chk(obj, obj_class) {
  let keyword = $(obj).attr('keyword');
  let checked = $(obj).prop('checked');
  //alert(checked);
  switch (keyword) {
    case 'all':
      if (checked) {
        $('.' + obj_class + '_each').prop('checked', true);
      } else {
        $('.' + obj_class + '_each').prop('checked', false);
      }
      break;
    default:
      check_chk(obj_class);
      break;
  }
}
function listener_chk_delete(obj, obj_target) {
  listener_chk(obj, 'input_chk_delete_' + obj_target);
}

function listenerGetDeleteIds(obj_target) {
  let ids = [];
  let input_chk_delete_each = $('.input_chk_delete_' + obj_target + '_each');
  for (let i = 0; i < input_chk_delete_each.length; i++) {
    let each_checked = $(input_chk_delete_each[i]).prop('checked');
    if (each_checked) {
      ids.push($(input_chk_delete_each[i]).attr('keyword'));
    }
  }
  return ids;
}

function listenerSetSearchKeyword(obj_target) {
  let select_search_keyword = $('.select_search_' + obj_target + '_keyword');
  for (let t = 0; t < select_search_keyword.length; t++) {
    let select_temp_name = $(select_search_keyword[t]).attr('name');
    let option_temps = $(select_search_keyword[t]).find('option');
    for (let i = 0; i < option_temps.length; i++) {
      let a_html = $(option_temps[i]).html();
      let a_value = $(option_temps[i]).attr('value');
      $('.font_' + obj_target + '_' + select_temp_name + '_' + a_value).html(a_html);
    }
  }
}
function listenerGetBooleanFromSelect(obj_id) {
  let search_deleted = null;
  let obj = '#' + obj_id;
  if ($(obj).val() !== '') {
    search_deleted = $(obj).val() === 'true';
  }
  return search_deleted;
}
/* scrollList관련 기능 */
function listenerGetCursor(obj_target) {
  let cursor = null;
  let input_cursor_id = $('.input_cursor_' + obj_target + '_id');
  if (input_cursor_id.length > 0) {
    cursor = $(input_cursor_id[input_cursor_id.length - 1]).val();
  }
  return cursor;
}
function listenerAfterScrollList(obj_target) {
  let font_order = $('.font_' + obj_target + '_order');
  for (let t = 0; t < font_order.length; t++) {
    $(font_order[t]).text(t + 1);
  }
  listenerSetSearchKeyword(obj_target);
}
/* pagedList관련 기능 */
// 순번배정 기능
function listenerFontOrder(obj_target, obj_num) {
  if (isNull(obj_num)) {
    obj_num = 0;
  }
  let font_order = $('.font_' + obj_target + '_order');
  for (let each of font_order) {
    $(each).text(++obj_num);
  }
}
function listenerAfterPagedList(obj_data, obj_target) {
  let tempOrder = (Number(obj_data['callpage']) - 1) * Number(obj_data['callpage']);
  listenerFontOrder(obj_target, tempOrder);

  $('.font_' + obj_target + '_total_itemcount').text(obj_data['listsize']);
  $('#search_' + obj_target + '_callpage').val(obj_data['callpage']);
  listenerSetSearchKeyword(obj_target);

  let callpage = obj_data['callpage'];
  let totalpage = obj_data['totalpage'];
  //가장 앞 페이지로 긴급 이동
  $('#ul_' + obj_target + '_pagination').append(
    `<li class="paginate_button page-item previous"><a href="javascript:listener_${obj_target}_callpage(1)" class="page-link">&lt;&lt;</a></li>`
  );
  //현재 페이지 보다 앞페이지로 이동 하는 부분
  for (let i = 0; i < 3; i++) {
    let tempPage = callpage - 3 + i;
    if (tempPage > 0) {
      $('#ul_' + obj_target + '_pagination').append(
        `<li class="paginate_button page-item"><a href="javascript:listener_${obj_target}_callpage('${tempPage}')" class="page-link">${tempPage}</a></li>`
      );
    }
  }
  $('#ul_' + obj_target + '_pagination').append(
    `<li class="paginate_button page-item active"><a href="javascript:listener_${obj_target}_callpage('${callpage}')" class="page-link">${callpage}</a></li>`
  );
  //현재 페이지 보다 뒤페이지로 이동 하는 부분
  for (let i = 0; i < 3; i++) {
    let tempPage = callpage + 1 + i;
    if (tempPage <= totalpage) {
      $('#ul_' + obj_target + '_pagination').append(
        `<li class="paginate_button page-item"><a href="javascript:listener_${obj_target}_callpage('${tempPage}')" class="page-link">${tempPage}</a></li>`
      );
    }
  }
  $('#ul_' + obj_target + '_pagination').append(
    `<li class="paginate_button page-item next"><a href="javascript:listener_${obj_target}_callpage('${totalpage}')" class="page-link">&gt;&gt;</a></li>`
  );
}

/* create관련 기능 */

var input_delay_timer;
function inputOnChange(obj_func) {
  clearTimeout(input_delay_timer);
  input_delay_timer = setTimeout(() => {
    obj_func();
  }, 200);
}

function listenerBeforeCreate() {
  let input_required = $('.input_required');
  for (let i = 0; i < input_required.length; i++) {
    if ($.trim($(input_required[i]).val()) == '') {
      alert($(input_required[i]).attr('placeholder'));
      $(input_required[i]).focus();
      return false;
    }
  }
  return true;
}
function listenerSetImage(obj_this, obj_func) {
  let tempId = $(obj_this).attr('id');
  let inputFile = document.getElementById(tempId);
  if (inputFile.files.length > 0) {
    let tempFile = inputFile.files[0];
    let src = URL.createObjectURL(tempFile);
    let img_id = '#img_' + tempId;
    $(img_id).removeClass('hide');
    $(img_id).attr('src', src);
    if (obj_func != null) {
      obj_func();
    }
  }
}
function listenerCreateParam() {
  let _param = {};
  let input_param = $('.input_param');
  for (let each of input_param) {
    let temp_type = $(each).attr('type') + '';
    if (temp_type === 'checkbox') {
      _param[$(each).attr('name')] = $(each).prop('checked');
    } else {
      _param[$(each).attr('name')] = $(each).val();
    }
  }
  return _param;
}
function listenerGetArrayData(obj_target) {
  let array_temp = [];
  $('.' + obj_target).each(function () {
    array_temp.push($(this).val());
  });
  return array_temp;
}
/* detail관련 기능 */
function listenerAfterDetail(obj_data, obj) {
  let detailKeys = Object.keys(obj_data);
  for (let eachKey of detailKeys) {
    $('.font_' + obj + '_' + eachKey).html(obj_data[eachKey]);

    let eachType = $('#detail_' + obj + '_' + eachKey).attr('type');
    if (eachType === 'checkbox') {
      $('#detail_' + obj + '_' + eachKey).prop('checked', obj_data[eachKey]);
    } else if (eachType === 'radio') {
      $('input[name="' + obj + '_' + eachKey + '"][value="' + obj_data[eachKey] + '"]').prop(
        'checked',
        true
      );
      $('#detail_' + obj + '_' + eachKey).val(obj_data[eachKey]);
    } else {
      let tempValue = '';
      if (!isNull(obj_data[eachKey])) {
        tempValue = obj_data[eachKey] + '';
      }
      console.log(tempValue);
      $('#detail_' + obj + '_' + eachKey).val(tempValue);
      if ($('#detail_' + obj + '_' + eachKey).prop('tagName') === 'SELECT') {
        $('.font_' + obj + '_' + eachKey).text(
          $('#detail_' + obj + '_' + eachKey + ' option:selected').text()
        );
      }
    }

    if (!isNull(obj_data[eachKey])) {
      $('#img_' + obj + '_' + eachKey).removeClass('hide');
      $('#img_' + obj + '_' + eachKey).attr('src', obj_data[eachKey]);
    }
  }
}
/* js 추가 기능 */
function isNull(x) {
  let result_x = false;
  x = x + '';
  if (x == null || x === 'null' || x === '' || x === 'undefined') {
    result_x = true;
  } else {
  }
  return result_x;
}
function number2digit(x) {
  var return_val = x + '';
  if (Number(x) < 10) {
    return_val = '0' + return_val;
  }
  return return_val;
}
function numberWithCommas(x) {
  x = x + '';
  let result_x = '';
  let result_x_head = '';
  let result_x_tail = '';
  if (x.indexOf('.') > -1) {
    let split_result_x = x.split('.');
    result_x_head = split_result_x[0];
    result_x_tail = '.' + split_result_x[1];
  } else {
    result_x_head = x;
  }
  result_x = result_x_head.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + result_x_tail;
  return result_x;
}
function numberWithKM(num) {
  num = Number(num);
  let tempNum = 0;
  let tempText = '';
  if (num >= 1_000_000) {
    tempNum = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
    tempText = 'M';
  } else if (num >= 1_000) {
    tempNum = (num / 1_000).toFixed(1).replace(/\.0$/, '');
    tempText = 'k';
  } else {
    tempNum = num.toString();
  }
  return numberWithCommas(tempNum) + tempText;
}
function numberWithK(x) {
  let result_x = 0;
  x = Number(x);
  if (x < 1000) {
    return x + '';
  } else if (x < 1000000) {
    //천부터 백만 사이
    result_x = x * 0.001;
    result_x.toFixed(1);
    return result_x + 'K';
  } else {
    result_x = x * 0.001 * 0.001;
    result_x.toFixed(1);
    return result_x + 'M';
  }
}

function diffDate(obj_d1, obj_d2) {
  let date1 = null;
  if (obj_d1 == null) {
    date1 = new Date();
  } else {
    date1 = new Date(obj_d1);
  }
  let date2 = new Date(obj_d2);

  let diffInMilliseconds = date2.getTime() - date1.getTime();
  if (diffInMilliseconds < 0) {
    return 'time over';
  }
  let diffInSeconds = diffInMilliseconds / 1000;
  let diffInMinutes = diffInSeconds / 60;
  let diffInHours = diffInMinutes / 60;
  let diffInDays = diffInHours / 24;

  let diffNum = 0;
  let diffText = '';

  if (diffInDays > 0) {
    diffNum = diffInDays;
    diffText = 'day';
  } else if (diffInHours > 0) {
    diffNum = diffInHours;
    diffText = 'hour';
  } else {
    diffNum = diffInMinutes;
    diffText = 'minute';
  }

  if (diffNum > 1) {
    diffText += 's';
  }
  return diffNum.toFixed(0) + ' ' + diffText;
}

function getNextDay(date_string, days) {
  let date = null;
  if (date_string == null) {
    date = new Date();
  } else {
    date = new Date(date_string);
  }
  if (days == null) {
    days = 1;
  }
  date.setDate(date.getDate() + days);
  return dateToStringFormat(date);
}
function dateToStringFormat(date) {
  if (date == null) {
    date = new Date();
  }
  let d = date.getDate();
  let m = date.getMonth();
  let y = date.getFullYear();
  let temp_today = y + '-' + number2digit(m + 1) + '-' + number2digit(d) + '';
  return temp_today;
}
function getIdFromUrl(obj) {
  let temp_url_with_idx = obj;
  if (obj == null) {
    temp_url_with_idx = window.location.href;
  }
  let split_slash_temp_idx = temp_url_with_idx.split('/');
  let temp_idx = split_slash_temp_idx[split_slash_temp_idx.length - 1];
  let split_question_temp_idx = temp_idx.split('?');
  if (split_question_temp_idx.length > 0) {
    temp_idx = split_question_temp_idx[0];
  }
  return temp_idx;
}
function listener_maxlength_check(obj, obj1) {
  let this_temp_val = $(obj).val();
  let this_temp_max = Number(obj1);
  if (this_temp_val.length > this_temp_max) {
    alert('최대 ' + this_temp_max + '자까지 입력 가능합니다.');
    $(obj).val(this_temp_val.substring(0, this_temp_max));
  }
}
function location_href_path_param(obj_param, obj_add_path) {
  location.href = obj_param + '' + obj_add_path;
}
function getSprExceptionMsg(obj_param) {
  let obj = JSON.parse(obj_param['responseText']);
  let stringTrace = JSON.stringify(obj['trace']);
  let index0 = stringTrace.indexOf('com.thc.sprapi.exception.SprException');
  let index1 = stringTrace.indexOf('\\r');
  let tempStringTrace = stringTrace.substring(index0, index1);
  tempStringTrace = tempStringTrace.replace('com.thc.sprapi.exception.SprException: ', '');
  return tempStringTrace;
}
function listener_detect_bottom() {
  let scrollTop = $(window).scrollTop();
  let innerHeight = $(window).innerHeight();
  let scrollHeight = $('body').prop('scrollHeight');
  return scrollTop + innerHeight >= scrollHeight;
}
function listener_detect_top(obj_top) {
  let scrollTop = $(window).scrollTop();
  return scrollTop <= obj_top;
}
function listener_copy_clipboard(obj_text) {
  window.navigator.clipboard.writeText(obj_text).then(() => {
    alert(obj_text + ' 복사 완료!');
  });
}
function getParamFromUrl(key) {
  return new URLSearchParams(window.location.search).get(key);
}

/**/
function listener_logout() {
  // 앱 저장소의 토큰도 비움 (안 비우면 index.html 이 예전 토큰으로 main.html 로 감)
  flutter_setLocalStorage('refreshToken', null);
  flutter_setLocalStorage('accessToken', null);

  localStorage.removeItem('refreshToken');
  localStorage.removeItem('accessToken');
  localStorage.clear();
}

function listener_app_history_back() {
  history.back();
}
function listener_app_out_sms(obj_phone, obj_body) {
  flutter_sendSMS(obj_phone, obj_body);
}
function listener_app_out_url(obj_url) {
  flutter_openUrl(obj_url);
}
function listener_app_out_share(obj_url) {
  flutter_share(obj_url);
}
flutter_listener_fcmtoken = function (obj_fcmtoken) {
  //alert("fcm : " + obj_fcmtoken);
  let _param = {
    id: 0,
  };
  _param['fcm'] = obj_fcmtoken;
  let _data = {};
  _data.url = '/api/user';
  _data.type = 'PUT';
  _data.param = _param;
  _data.success = function (obj_data, obj_status, obj_xhr) {};
  _data.error = function (obj_data, obj_status, obj_xhr) {
    //alert("정상적으로 이루어지지 않았습니다. 다시 시도해주세요.");
  };
  func_ajax(_data);
};
//배포 전 확인 필수
let temp_url_share = 'https://ssssss.kr/page/referral/';
function listener_share_before() {
  /*$(".input_user_code_invite").val(temp_url_share + $("#detail_myuser_code").val());
    listener_main_modal_open('invite');*/
}
function listener_share() {
  listener_app_out_share(temp_url_share + $('#detail_myuser_code').val());
}
