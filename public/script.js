String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
};

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

var default_xhr_error = function(page, status, data) {
	document.open();
	document.write(data);
	document.close();
};

var get = function(page, success_cb, failed_cb=default_xhr_error) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', page);
	xhr.onload = function() {
		if (xhr.status === 200) {
			if (success_cb)
				success_cb(xhr.responseText);
		} else {
			if (failed_cb)
				failed_cb(page, xhr.status, xhr.responseText);
		}
	};
	xhr.send();
};

var post = function(page, data, success_cb, mime='application/json;charset=UTF-8') {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', page);
	xhr.setRequestHeader('Content-Type', mime);
	xhr.onload = function() {
		if (xhr.status === 200) {
			if (success_cb)
				success_cb(xhr.responseText);
		} else
			default_xhr_error(page, xhr.status, xhr.responseText);
	};
	xhr.send(data);
};

var menu_object_cb = function(e) {
  this.classList.toggle('opened');
  var type = this.dataset['type'];
  if (type === 'projects') {
    var li = document.getElementById('projects_menu').getElementsByTagName('li');
    for (var i = 0; i < li.length; i++) {
      if (li[i].firstElementChild === this)
        continue;
      li[i].firstElementChild.classList.remove('opened');
    }
  }
};

var draggable = function(el) {
  var x = 0, y = 0, dx = 0, dy = 0;
  
  var init = function(e, move_fn) {
    e = e || window.event;
    e.preventDefault();
    x = e.clientX;
    y = e.clientY;
    document.onmouseup = end;
    document.onmousemove = move_fn;
  };
  
  document.getElementById(el.id + '_header').addEventListener('mousedown', function(e) {
    init(e, start_drag);
  });
  
  document.getElementById(el.id + '_resize').addEventListener('mousedown', function(e) {
    init(e, start_resize);
  });
  
  document.getElementById(el.id + '_del').addEventListener('click', function(e) {
    // TOOD: Delete entry from redis
  });
  
  document.getElementById(el.id + '_close').addEventListener('click', function(e) {
    el.parentNode.removeChild(el);
  });
  
  var update = function(e) {
    e = e || window.event;
    e.preventDefault();
    dx = x - e.clientX;
    dy = y - e.clientY;
    x  = e.clientX;
    y  = e.clientY;
  };
  
  var start_drag = function(e) {
    update();
    
    var dbbcr = document.body.getBoundingClientRect();
    var dbw = dbbcr.width;
    var dbh = dbbcr.height;
    var elbcr = el.getBoundingClientRect();
    var elw = elbcr.width;
    var elh = elbcr.height;
    var maxx = dbw - elw - 1;
    var maxy = dbh - elh - 1;
    var ww = (el.offsetLeft - dx).clamp(1, maxx);
    var wh = (el.offsetTop - dy).clamp(1, maxy);
    
    el.style.left = ww + "px";
    el.style.top  = wh + "px";
  };
  
  var start_resize = function(e) {
    update();
    
    var bcr = el.getBoundingClientRect();
    var nw = Math.max(bcr.width - dx, 200);
    var nh = Math.max(bcr.height - dy, 200);
    
    el.style.width  = nw + "px";
    el.style.height = nh + "px";
  };
  
  var end = function(e) {
    document.onmouseup = undefined;
    document.onmousemove = undefined;
  };
};

var new_window = function(id) {
};

document.addEventListener('DOMContentLoaded', function(e) {
  var toggler = document.getElementsByClassName('caret');
  for (var i = 0; i < toggler.length; i++)
    toggler[i].addEventListener('click', function(e) {
      this.parentElement.querySelector('.nested').classList.toggle('inactive');
      this.classList.toggle('caret-down');
    });
  
  var menu = document.getElementById('menu');
  document.getElementById('show_menu').addEventListener('click', function(e) {
    menu.style.visibility = 'visible';
  });
  
  document.getElementById('hide_menu').addEventListener('click', function(e) {
    menu.style.visibility = 'hidden';
  });
  
  var add = document.getElementsByClassName('add');
  var add_box = document.getElementById('add');
  var add_title = document.getElementById('add_title');
  var search = document.getElementById('search');
  var search_type = document.getElementById('search_type');
  
  for (var i = 0; i < add.length; i++)
    add[i].addEventListener('click', function(e) {
      var type = this.dataset['type'];
      add_title.innerText = "Add to " + type.capitalize();
      search_type.value = type;
      if (add_box.classList.contains('inactive'))
        add_box.classList.remove('inactive');
    });
  document.getElementById('add_close').addEventListener('click', function(e) {
    add_box.classList.toggle('inactive');
  });
  search.addEventListener('keydown', function(e) {
    if (e.keyCode != 13)
      return;

    var type = search_type.value;
    post('/api/add',
    JSON.stringify({
      type: type,
      title: search.value
    }), function(json) {
      data = JSON.parse(json);
      var li = document.createElement('li');
      var span = document.createElement('span');
      span.classList = ['object'];
      span.id = data['id'];
      span.dataset['type'] = data['type'];
      span.innerText = data['title'];
      span.addEventListener('click', menu_object_cb);
      li.appendChild(span);
      document.getElementById(data['type'] + '_menu').appendChild(li);
      add_box.classList.toggle('inactive');
    });
    search.value = '';
  });
  
  var objs = document.getElementsByClassName('object');
  for (var i = 0; i < objs.length; i++)
    objs[i].addEventListener('click', menu_object_cb);
  
  var test = document.getElementById('test_window');
  draggable(test);
});