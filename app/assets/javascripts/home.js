//The collisiton detection with tranistion do not work perfectly,
//need a flag showing that the target is disposed
//


var height = 500;
    width = 500;
    svg = null;
    wheel_rotation = 30; 
    base_circle = {x: width/2, y: height/2 , r: 70}
    color = d3.scale.category20();
    collision_targets = [base_circle];
    enemies = [];
  
var enemyGeneration = -1;


var defenders = [
    generatePointOnCircle(0,85),
    generatePointOnCircle(120,85),
    generatePointOnCircle(240,85)
  ];

$(defenders).each(function(i,d){
    d.r = 10;
    d.x = width/2+d.x;
    d.y = height/2+d.y;
});

//collision_targets = collision_targets.concat(defenders);

var game_status = { 
  wheel_rotation: 0,
  level: 0,
  buf: -1,
  score: 0,
  state: 0, //0 before, 1: ongoing, 2 end, 3 pause, 
  health: [100,100,100]
}



//--------------------------------------------------------------------------

var arc = d3.svg.arc()
    .innerRadius(20)
    .outerRadius(70)
    .startAngle(function(d){ return (d + wheel_rotation) * (Math.PI/180)}) //converting from degs to radians
    .endAngle(function(d){ return (d + wheel_rotation + 120) * (Math.PI/180)})

var innerArc = d3.svg.arc()
    .innerRadius(20)
    .outerRadius(function(d){ return d/100 * 50 + 20;})
    .startAngle(function(d,i){ return (i*120 + wheel_rotation) * (Math.PI/180)}) //converting from degs to radians
    .endAngle(function(d,i){ return (i*120 + wheel_rotation + 120) * (Math.PI/180)})

var inArc = d3.svg.arc()
    .innerRadius(0)
    .outerRadius(19)
    .startAngle(0) //converting from degs to radians
    .endAngle(0);

var shieldArc = d3.svg.arc()
    .innerRadius(70)
    .outerRadius(70)
    .startAngle(0) //converting from degs to radians
    .endAngle(2*Math.PI);

function changeArc(svg){
  svg.selectAll(".arcs")
    .attr("d", arc);
  svg.selectAll(".inner-arcs")
    .attr("d", innerArc);
}

function tickTween(d,i){
        return function(t){
            //console.log();
            var element = d3.select(this);
            element.attr("T",t);
            d.x = element.attr("cx");
            d.y = element.attr("cy");
            circleCollision(d,function(target){
              if(target == base_circle){
                
                if(element.attr("D") == null){
                  element.attr("D",true);
                  //game logic here haha, reduce or get health
                  console.log(coordsToAngle(d.x-width/2,d.y-height/2));
                }
                //desdroy of the element do not work correctly. The callback may be triggerred twice when collision
                //need a flag D to mark the element so that we know is is handled before.
                element.attr("fill-opacity","100%").transition().duration(50).attr("fill-opacity","50%").remove();
              }
            });
        }
    }

function generateDots(svg){
  enemies =[
    generatePointOnCircle(Math.round(Math.random()*360),width),
    generatePointOnCircle(Math.round(Math.random()*360),width),
    generatePointOnCircle(Math.round(Math.random()*360),width)
  ]

  $(enemies).each(function(i,d){
    d.r = Math.round(Math.random()*10)+5;
    d.x = width/2+d.x;
    d.y = height/2+d.y;
  });

  svg.selectAll(".enemy").data(enemies).enter().append("circle")
    .attr("class","enemy")
    .attr("r",function(d,i){ return d.r; })
    .attr("cx", function(d,i){ return d.x; } )
    .attr("cy", function(d,i){ return d.y; } )
    .attr("fill",function(d,i){ return color(i);} )
    .attr("AT",2000) //set at time tracker for game pause;
  .transition().duration(2000).ease("linear")
    .tween("assignment", tickTween)
    .attr("cx", width/2)
    .attr("cy", height/2)
    .remove();
}

function generateShield(svg){
  svg.selectAll(".shield").data([10]).enter().append("path")
    .attr("d",shieldArc)
    .attr("fill","white")
    .attr("transform", "translate("+height/2+","+width/2+")")
    .transition().duration(1000)
    .attr("d",shieldArc.outerRadius(75))
    .transition().duration(1000)
    .attr("d",shieldArc.outerRadius(70))
    .remove();
}

function generateDefenders(svg){
  var distance = 85;
  
  svg.selectAll(".defender").data(defenders).enter().append("circle")
    .attr("fill","white")
    .attr("r",function(d){return d.r;})
    .attr("cx",function(d,i){ return d.x})
    .attr("cy",function(d,i){ return d.y})
    .transition().duration(2000).ease("linear")
    .attrTween("cx",function(d,i){
      var it = d3.interpolate(1,360);
      return function(t){
        var p = generatePointOnCircle(120*i+it(t),distance);
        return (p.x + width/2)
      }
    }).attrTween("cy",function(d,i){
      var it = d3.interpolate(1,360);
      return function(t){
        var p = generatePointOnCircle(120*i+it(t),distance);
        return (p.y + height/2);
      }
    }).remove();
}

function generatePointOnCircle(angle,r){//in degree
  var rads = angle/180*Math.PI;
  var x = Math.cos(rads)*r;
  var y = Math.sin(rads)*r;

  return {x:x,y:y};
}

function circleCollision(d1,callback){
  //$(enemies).each(function(i,d1){
    var collide = false;
    $(collision_targets).each(function(i2,d2){
      var  l=  Math.sqrt( (d1.x-d2.x) *(d1.x-d2.x) + (d1.y-d2.y)*(d1.y-d2.y) );
      if(l< (d2.r+d1.r)){ //if center distance is less than sum of r, then overlap
        collide = true;
        callback(d2);
      }
    });
    return collide;
  //});
}

function startGame(){
  setInterval(function(){
    enemyGeneration = generateDots(svg);
  },2000);
}

function pauseGame(){
  d3.selectAll(".enemy").transition().duration(0);
  clearInterval(enemyGeneration);
}

function resumeGame(){
  svg.selectAll(".enemy").transition().duration(function(d,i){
      var remain = 1-d3.select(this).attr("T");
      var time = d3.select(this).attr("AT");
      var remain_time = time*remain;
      d3.select(this).attr("AT",remain_time);
      return remain_time;
    })
    .ease("linear")
    .tween("assignment", tickTween)
    .attr("cx", width/2)
    .attr("cy", height/2)
    .remove();
}

function setGameState(state){
  switch(state) {
    case 1:
      if(game_status.state == 2){
        resumeGame();
      }else{
        startGame();
      }
      break;
    case 2:
      pauseGame();
      break;
  }
  game_status.state = state;
}

function coordsToAngle(x,y){
  if(y == 0 && x >0) {
    return 90;
  }
  else if(y==0 && x<0){
    return 270;
  }
  else if(x==0 && y<0){
    return 180;
  }
  else if(x==0 && y>0){
    return 0;
  }

  var t = Math.atan(x/y);
  var temp_r = null;
  if(y>0){
    temp_r = Math.PI - t;
  }
  else if(y<0&& x>0){
    temp_r = -t;
  }
  else if(y<0&& x<0){
    temp_r = 2*Math.PI - t
  }
  return temp_r/Math.PI * 180;

}


//-----------------------------------execution

$(function(){
  svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("style","background-color:black");

  //inner buf indicator
  var indicator = svg.append("path")
    .attr("class","inArc")
    .attr("d", inArc)
    .attr("transform", "translate("+height/2+","+width/2+")")
    .attr("fill", "white")
    .attr("fill-opacity", "60%");
 
  d3.select("body")
    .on("keydown", function(){
      if(d3.event.keyCode == 37){
        wheel_rotation+=5;
      }
      else if(d3.event.keyCode == 39){
        wheel_rotation-=5;
      }
      else if(d3.event.keyCode == 32){
        if(game_status.state == 0){
          setGameState(1);
        }
        else if(game_status.state == 1){
          setGameState(2);
        }
         else if(game_status.state == 2){
          setGameState(1);
        }
        
      }


      changeArc(svg);
    });

  //data is offsets
  svg.selectAll(".arcs").data([0,120,240]).enter().append("path")
    .attr("class","arcs")
    .attr("d", arc)
    .attr("transform", "translate("+ base_circle.x +","+ base_circle.y +")")
    .attr("fill",function(d,i){return color(i);})
    .attr("fill-opacity","60%");

  svg.selectAll(".inner-arcs").data(game_status.health).enter().append("path")
    .attr("class","inner-arcs")
    .attr("d", innerArc)
    .attr("transform", "translate("+height/2+","+width/2+")")
    .attr("fill",function(d,i){return color(i);});

  setInterval(function(){
   indicator.transition().duration(2000)
    .attrTween("d", function(){
      var i = d3.interpolate(0,2*Math.PI);
      return function(t){
        inArc.endAngle(i(t));
        return inArc();
      }
    });
  },2000);

  /*setInterval(function(){
   svg.selectAll(".inner-arcs").transition().delay(function(d,i){ return 200*i; }).duration(2000)
    .attrTween("d", function(d){
      var i = d3.interpolate(70,20);
      return function(t){
        innerArc.outerRadius(i(t));
        return innerArc(d);
      }
    });
  },2600);*/
 
  /*setInterval(function(){
    generateDefenders(svg);
    generateShield(svg);
  },2000);*/
});

