var height = 1000;
var width = 1000;


$(function(){
var wheel_rotation = 30;  
var color = d3.scale.category20();


var svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)


var arc = d3.svg.arc()
    .innerRadius(0)
    .outerRadius(70)
    .startAngle(function(d){ return (d+wheel_rotation) * (Math.PI/180)}) //converting from degs to radians
    .endAngle(function(d){ return (d+wheel_rotation+120) * (Math.PI/180)})

//data is offsets
svg.selectAll("path").data([0,120,240]).enter().append("path")
    .attr("d", arc)
    .attr("transform", "translate(200,200)")
    .attr("fill",function(d,i){return color(i);});

})
