let capitalise = s => s[0].toUpperCase() + s.slice(1).toLowerCase();

let clamp = (n, min, max) => Math.min(Math.max(n, min), max);

let xhr_error_cb = (url, status, data) => {
  document.open();
  document.write(`${url}:${status}: ${data}`);
  document.close();
};

let get = (url, cb) => {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.onload = () => xhr.status === 200 ? cb(xhr.responseText) : xhr_error_cb(url, xhr.status, xhr.responseText);
  xhr.send();
};

let post = (url, data, cb, mime='application/json;charset=UTF-8') => {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', mime);
  xhr.onload = () => xhr.status === 200 ? cb(xhr.responseText) : xhr_error_cb(url, xhr.status, xhr.responseText);
  xhr.send(data);
};

let find = (sel, pel = document) => {
  let p = 'querySelectorAll';
  if (sel[0] === '#') {
    p = 'getElementById';
    sel = sel.slice(1);
  }
  let ret = pel[p](sel);
  return ret.length === undefined ? ret : (ret.length === 1 ? ret[0] : ret);
};

let on = (el, action, cb) => {
  el.addEventListener(action, cb);
};

let del = (el) => {
  el.parentNode.removeChild(el);
};

let dom = (t, c = false, v = false) => `<${t}${v ? ' ' + Object.entries(v).map(a => a[0] + '="' + a[1] + '"').join(' ') : ''}${c ? '>' + c + '</' + t + '>' : '/>'}`;

let log = console.log;

let create_window = (id, w=0, h=0) => {
  let d = dom('div',
    dom('div',
      dom('div', 'test [test]', {'class': 'title-bar-text'}) +
      dom('div', dom('button', '', {'aria-label': 'Close'}), {'class': 'title-bar-controls'}),
    {'class': 'title-bar', 'id': id}) +
    dom('div', '', {'class': 'window-body'}) +
    dom('div', '', {'class': 'window-resize', 'id': id}),
  {'class': 'window window-center', 'id': id});
  document.body.insertAdjacentHTML('beforeend', d);
  let el = find('.window#' + id);
  on(find('.title-bar-controls button', el), 'click', (e) => {
    del(el);
  });
  if (w !== 0 && h !== 0) {
    el.style.width  = w + "px";
    el.style.height = h + "px";
  }
  return el;
};

let draggable = (el) => {
  let x = 0, y = 0, dx = 0, dy = 0;
  
  let init = (e, move_fn) => {
    e = e || window.event;
    e.preventDefault();
    x = e.clientX;
    y = e.clientY;
    document.onmouseup = end;
    document.onmousemove = move_fn;
  };
  
  el.classList.remove('window-center');
  on(find('.title-bar', el), 'mousedown', e => init(e, start_drag));
  on(find('.window-resize', el), 'mousedown', e => init(e, start_resize));
  
  let update = (e) => {
    e = e || window.event;
    e.preventDefault();
    dx = e.clientX - x;
    dy = e.clientY - y;
    x  = e.clientX;
    y  = e.clientY;
  };
  
  let start_drag = (e) => {
    update(e);
    
    let dbbcr = document.body.getBoundingClientRect();
    let dbw = dbbcr.width;
    let dbh = dbbcr.height;
    let elbcr = el.getBoundingClientRect();
    let elw = elbcr.width;
    let elh = elbcr.height;
    let maxx = dbw - elw - 1;
    let maxy = dbh - elh - 1;
    let ww = clamp(el.offsetLeft + dx, 1, maxx);
    let wh = clamp(el.offsetTop  + dy, 1, maxy);
    
    el.style.left = ww + "px";
    el.style.top  = wh + "px";
  };
  
  let start_resize = (e) => {
    update(e);
    
    let cs = getComputedStyle(el, '');
    let nw = Math.max(parseInt(cs.width) + dx, 200);
    let nh = Math.max(parseInt(cs.height) + dy, 200);
    
    el.style.width  = nw + "px";
    el.style.height = nh + "px";
  };
  
  let end = (e) => {
    document.onmouseup = undefined;
    document.onmousemove = undefined;
  };
};

let menu_cb = (e) => {
  let type = e.target.dataset['type'];
  if (type === 'projects')
    return; // TODO
  if (e.target.classList.contains('opened')) {
    e.target.classList.remove('opened');
    del(find('.window#' + e.target.id));
  } else {
    e.target.classList.add('opened');
    draggable(create_window(e.target.id));
  }
};

on(document, 'DOMContentLoaded', (e) => {
  for (let li of find('.tree-view-li'))
    on(li, 'click', menu_cb);
});