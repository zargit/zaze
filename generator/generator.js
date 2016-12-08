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
	this.getWallCount = function(){
		var c = 0;
		for(var i=0;i<this.walls.length;i++){
			if(this.walls[i]==0) c++;
		}
		return c;
	}
};

function Maze(size){
	this.size = size;

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
		var row = $("<tr class='row'></tr>");
		for(var j=0;j<maze.size.col;j++){
			var cell = $("<td class='cell'></td>");
			$(cell).css("width", "20px");
			$(cell).css("height", "20px");

			if(maze.grid[i][j].walls[0]==0) $(cell).css("border-top", "1px solid black");
			if(maze.grid[i][j].walls[1]==0) $(cell).css("border-bottom", "1px solid black");
			if(maze.grid[i][j].walls[2]==0) $(cell).css("border-left", "1px solid black");
			if(maze.grid[i][j].walls[3]==0) $(cell).css("border-right", "1px solid black");
			row.append(cell);
		}
		table.append(row);
	}
	container.append(table);

	$("body").append(container);
}

function init(){
	var maze = new Maze(new Dimension(40,40));
	maze.generate();
	console.log(maze);
	buildDisplay(maze);
}
