var dr = [-1, 1, 0, 0];
var dc = [0, 0, -1, 1];

function getRandomNumber(start, end){
  return parseInt(Math.random()*(end-start)+start);
}

function Dimension(row, col){
  this.row = row;
  this.col = col;
};

function Tile(){
  this.walls = [0,0,0,0]; 
  this.visited = false;
  this.dom_elem = null;
  this.path_count = 0;
  this.getWallCount = function(){
    var c = 0;
    for(var i=0;i<this.walls.length;i++){
      if(this.walls[i]==0) c++;
    }
    return c;
  }
};

function Ambient(maze, ambient){
  this.maze = maze;
  this.box = ambient ? ambient:$("<div class='box' style='background-color:black;'></div>");
  this.target = {r:-1, c:-1};
  this.state = null;
  this.locked = false;
  this.path = [];
  this.step = -1;

  this.activate = function(){
    var pos = {r:getRandomNumber(0, maze.size.row), c:getRandomNumber(0, maze.size.col)};
    this.box.offset(this.maze.grid[pos.r][pos.c].dom_elem.offset());
    this.box.css({"position":"fixed", "width": (this.maze.cellSize.width-4)+"px", "height": (this.maze.cellSize.height-4)+"px", "margin":"2px"});
    $("body").append(this.box);
    this.setNewPath([]);
    this.lookout();
  }

  this.roam = function(){
    if(this.locked) return;
    var paths = [];
    var cell = document.elementFromPoint(this.box.offset().left-1, this.box.offset().top-1);
    var row = parseInt($(cell).closest('.row').data('row'));
    var col = parseInt($(cell).data('col'));
    for(i=0;i<4;i++){
      if(this.maze.isInside({r:row, c:col}) && this.maze.grid[row][col].walls[i]==1){
        var r = row, c = col;
        if(i==0) r--;
        else if(i==1) r++;
        else if(i==2) c--;
        else if(i==3) c++;
        paths.push(this.maze.grid[r][c].dom_elem);
      }
    }
    var random = getRandomNumber(0, paths.length);
    var that = this;
    this.locked = true;
    $(this.box).animate({
      left: paths[random].offset().left+"px",
      top: paths[random].offset().top+"px"
    }, 1000, function(){
      that.locked = false;
      if(that.state === "roam"){
        that.roam();
      }
    });
  }

  this.lookout = function(){
    // Checks for path to follow or roam
    var that = this;

    // Uncomment following snippet to enable path to mouse pointer
    /*
    $(document).mousemove(function(event){

      var elem = document.elementFromPoint(event.pageX, event.pageY);
      if($(elem).hasClass('cell')){
        var row = parseInt($(elem).closest('.row').data('row'));
        var col = parseInt($(elem).data('col'));
        if(that.target.r != row || that.target.c != col){  
          that.box.clearQueue().stop(false, false);
          that.state = "lookout";
          that.target.r = row;
          that.target.c = col;
          var current_cell = document.elementFromPoint(that.box.offset().left-1, that.box.offset().top-1);
          var start = {r:parseInt($(current_cell).closest('.row').data('row')), c:parseInt($(current_cell).data('col'))};
          var path = that.findpath(start, that.target);
          that.setNewPath(path);    
        }
      }
    });
    */


    // Following snippet starts the roaming after mouse leaves the ambient
    $(that.box).mouseleave(function(){
      if(that.state !== "roam"){
        that.setNewPath([]);
      } 
    });

    // Following snippet stops the roaming after mouse enters the ambient
    $(that.box).mouseenter(function(){
      if(that.state == "roam"){ 
        that.state = "freeze";
        that.box.stop();
      }
    });
  }

  this.findpath = function(start, destination){
    var q = [];
    var trace = [];
    var visited = [];
    for(i=0;i<this.maze.size.row;i++){
      visited.push([]);
      trace.push([])
        for(j=0;j<this.maze.size.col;j++){
          visited[i].push(0);
          trace[i].push({r:-1, c:-1});
        }
    }
    q.push(start);
    while(q.length > 0){
      var p = q.shift();
      visited[p.r][p.c] = 2;
      if(p === destination) break;
      var walls = this.maze.grid[p.r][p.c].walls;
      for(i=0;i<dr.length;i++){
        if(walls[i]==1){
          var np = {r:p.r+dr[i], c:p.c+dc[i]};
          if(this.maze.isInside(np) && visited[np.r][np.c]==0){
            q.push(np);
            trace[np.r][np.c].r = p.r;
            trace[np.r][np.c].c = p.c;
            visited[np.r][np.c] = 1;
          }
        }
      }
    }
    var curp = {r:destination.r, c:destination.c};
    var path = [];
    while(trace[curp.r][curp.c].r != -1){
      path.unshift(curp);
      curp = trace[curp.r][curp.c];
    }
    return path;
  }

  this.setNewPath = function(newpath){
    this.clearHighlight();
    this.path = newpath;
    this.highlightPath(newpath);
    if(this.path.length > 0){
      this.step = 0;
      this.box.css('color', 'blue');
      if(this.state !== "follow"){
        this.box.clearQueue().finish();
        this.locked = false;
        this.state = "follow";
        this.followPath();
      }
    }else{
      this.box.css('color', 'black');
      if(this.state !== "roam"){
        this.box.clearQueue().finish();
        this.locked = false;
        this.state = "roam";
        this.roam();
      }
    }
  }
  
  this.clearHighlight = function(){
    var temp = this.path;
    if(temp.length > 0){
      for(var i=0;i<temp.length;i++){
        var tile = this.maze.grid[temp[i].r][temp[i].c];
        tile.path_count--;
        if(tile.path_count <= 0){
          tile.dom_elem.css('background-color', 'white');
        }
      }
    }
  }

  this.highlightPath = function(newpath){
    for(var i=0;i<this.path.length;i++){
      var tile = this.maze.grid[this.path[i].r][this.path[i].c];
      tile.path_count++;
      tile.dom_elem.css('background-color', '#eee');
    } 
  }

  this.followPath = function(){ 
    if(this.step >= this.path.length){
      this.step = 0;
      this.clearHighlight();
      this.path = [];
      return;
    }
    if(this.locked) return;
    this.locked = true;
    var grid = this.maze.grid;
    var that = this;
    $(this.box).animate({
      left: grid[this.path[this.step].r][this.path[this.step].c].dom_elem.offset().left+"px",
      top: grid[this.path[this.step].r][this.path[this.step].c].dom_elem.offset().top+"px"
    }, 100, function(){
      that.locked = false;
      that.step++;
      if(that.state === "follow"){
        that.followPath();
      }
    });
  }
}


function Maze(size, cellSize){
  this.size = size;
  this.cellSize = cellSize;

  this.grid = [];

  this.opposite = {2:3, 3:2, 1:0, 0:1};

  this.isInside = function(pos){
    if(pos.r>=0 && pos.r<this.size.row && pos.c>=0 && pos.c<this.size.col){
      return true;
    }
  };

  this.getAdjacentPosition = function(pos){
    var adjacents = [{r:pos.r-1,c:pos.c+0},{r:pos.r+0,c:pos.c+1},{r:pos.r+1,c:pos.c+0},{r:pos.r+0,c:pos.c-1}];
    var j, x;
    for (var i = adjacents.length;i;i--) {
      j = Math.floor(Math.random() * i);
      x = adjacents[i - 1];
      adjacents[i - 1] = adjacents[j];
      adjacents[j] = x;
    }
    return adjacents;
  };

  this.getRelativePosition = function(first, second){
    if(first.r===second.r){
      if(first.c>second.c) return 2; // left
      else return 3; // right
    }else if(first.c===second.c){
      if(first.r>second.r) return 0; //up
      else return 1; // down
    }
  };

  this.generate = function(){
    var pos = {r:getRandomNumber(0,this.size.row), c:getRandomNumber(0,this.size.col)};
    this.grid[pos.r][pos.c].visited = true;

    var stack = [pos];

    while(stack.length>0){
      var cur = stack.pop();

      var wallCount = this.grid[cur.r][cur.c].getWallCount();

      var adjacents = this.getAdjacentPosition(cur);
      for(var i=0;i<adjacents.length;i++){
        var newPos = adjacents[i];
        if(this.isInside(newPos) && this.grid[newPos.r][newPos.c].visited==false){
          var side = this.getRelativePosition(cur, newPos);
          this.grid[cur.r][cur.c].walls[side] = 1;	
          this.grid[newPos.r][newPos.c].walls[this.opposite[side]] = 1;
          this.grid[newPos.r][newPos.c].visited = true;			

          stack.push(newPos);
        }
      }
    }
  }

  for(var i=0;i<size.row;i++){
    var row = [];
    for(var j=0;j<size.col;j++){
      row.push(new Tile());
    }
    this.grid.push(row);
  }
};

window.onload = init;

function buildDisplay(maze){
  var container = $("<div class='container'></div>");
  var table = $("<table></table>");
  $("table").css("border-collapse", "collapse");
  for(var i=0;i<maze.size.row;i++){
    var row = $("<tr class='row' data-row='"+i+"'></tr>");
    for(var j=0;j<maze.size.col;j++){
      var cell = $("<td class='cell' data-col='"+j+"'></td>");
      $(cell).css("width", maze.cellSize.width+"px");
      $(cell).css("height", maze.cellSize.height+"px");

      if(maze.grid[i][j].walls[0]==0) $(cell).css("border-top", "1px solid black");
      if(maze.grid[i][j].walls[1]==0) $(cell).css("border-bottom", "1px solid black");
      if(maze.grid[i][j].walls[2]==0) $(cell).css("border-left", "1px solid black");
      if(maze.grid[i][j].walls[3]==0) $(cell).css("border-right", "1px solid black");
      row.append(cell);
      maze.grid[i][j].dom_elem = cell;
    }
    table.append(row);
  }
  container.append(table);

  $("body").append(container);
}

function addIconInMazeTile(maze, pos, iconUrl, linkUrl){
  var icon = $("<img src='"+iconUrl+"' width='"+maze.cellSize.width+"' height='"+maze.cellSize.height+"'>");
  var link = $("<a href='"+linkUrl+"'></a>");
  $(link).append(icon);
  $(maze.grid[pos.r][pos.c].dom_elem).append(link);
}

function addAmbientInMazeTile(maze, pos, isRoamer = false, iconUrl='question-mark.svg', linkUrl){
  var icon = $("<img src='"+iconUrl+"' width='"+(maze.cellSize.width-4)+"' height='"+(maze.cellSize.height-4)+"'>");
  var link = $("<a href='"+linkUrl+"'></a>");
  $(link).append(icon);
  if(pos){
  }
  var ambient = new Ambient(maze, $(link));
  if(isRoamer){
    ambient.activate();
  }else{
    if(!pos){
      pos = {r:getRandomNumber(0, maze.size.row), c:getRandomNumber(0, maze.size.col)};
    }
    $(maze.grid[pos.r][pos.c].dom_elem).append(link);
  }
}

function init(){
  var cellHeight = 40;
  var cellWidth = 40;
  var width = parseInt($(window).width()/cellWidth);
  var height = parseInt($(window).height()/cellHeight) - 1;
  var maze = new Maze(new Dimension(height, width), {'width': cellWidth, 'height': cellHeight});
  maze.generate();
  buildDisplay(maze);
  
  addAmbientInMazeTile(maze, null, true, 'mark-github.svg', 'https://github.com/zargit/zaze');
  addAmbientInMazeTile(maze, null, true, 'fb-logo.svg', 'https://facebook.com/zarir.ahmad');
  addAmbientInMazeTile(maze, null, true, 'queensu-logo.svg', 'mailto:a.zarir@queensu.ca');
  addAmbientInMazeTile(maze, null, true, 'cv-logo.svg', 'https://zargit.github.io');
  addAmbientInMazeTile(maze, null, true, 'iium-logo.svg', 'mailto:abdullah.zarir@live.iium.edu.my');
  
  //console.log(maze.size.col-1);
  //addIconInMazeTile(maze, {r:0, c:maze.size.col-1}, 'mark-github.svg', 'https://github.com/zargit/zaze');
  //var octocat = "<img src='mark-github.svg' width='"+cellWidth+"' height='"+cellHeight+"'>";
  //var ambient = new Ambient(maze, $(octocat));
  //ambient.activate();
  
  // Uncomment following snippet to activate spawning on mouse click
  /*
  $("body").on('click', function(){
    ambient = new Ambient(maze, $(octocat));
    ambient.activate();
  });
  */

}
