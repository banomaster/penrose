var w,h,center,scale, gr, nSteps, svg;

$(function(){
  w = window.innerWidth;
  h = window.innerHeight;
  
  center = {x: w/2, y: h/2}
  scale = 0.6;
    
  gr = (1 + Math.sqrt(5)) / 2 //golder ration

  nSteps = 0;

  generatePenroseTiling();

  $( "#form" ).submit(function( event ) {
    event.preventDefault();
    $("svg").remove();


    nSteps = $("#nSteps").val();

    generatePenroseTiling();
  });
});


function scalePoints(points) {
  var newPoints = {};
  Object.keys(points).forEach(function(key) {
    var p = points[key];
    newPoints[key] = ({x: p.x + (center.x - p.x) * scale, y: p.y + (center.y - p.y) * scale});
  })
  return newPoints;
}

function reflect(A, P1, P2) {

  var dx  = P2.x - P1.x;
  var dy  = P2.y - P1.y;

  var a = (dx * dx - dy * dy) / (dx * dx + dy*dy);
  var b = 2 * dx * dy / (dx*dx + dy*dy);

  var x  = Math.round(a * (A.x - P1.x) + b*(A.y - P1.y) + P1.x); 
  var y  = Math.round(b * (A.x - P1.x) - a*(A.y - P1.y) + P1.y);

  return ({x: x, y: y});
}

function newTriangle(type, A, B, C) {
  return {type: type, points: {A: A, B: B, C: C}};
}

function computeNewPoint(A, B) {
  return { 
    x: A.x + (B.x - A.x) / gr,
    y: A.y + (B.y - A.y) / gr,
  }
}

function subdivide(triangles) {
  var newTriangles = [];
  triangles.forEach(function(t) {
    var p = t.points;
    if (t.type == 0) {
      // subdivide 0 type
      var P = computeNewPoint(p.A, p.B);
      newTriangles.push(newTriangle(0, p.C, P, p.B));
      newTriangles.push(newTriangle(1, P, p.C, p.A));
    } else {
      // subdivide 1 type
      var Q = computeNewPoint(p.B, p.A);
      var R = computeNewPoint(p.B, p.C);
      newTriangles.push(newTriangle(1, R, p.C, p.A));
      newTriangles.push(newTriangle(1, Q, R, p.B));
      newTriangles.push(newTriangle(0, R, Q, p.A));
    }
  });
      
  return newTriangles
}

function generatePenroseTiling() {
  
  var v =  (w / 2) * Math.tan(36 * Math.PI / 180);
  var triangles = [{
    type: 1,
    points: {
      A: {x: w/2, y: (h / 2) - v },
      B: {x: 0.0, y: h / 2},
      C: {x: w, y: h / 2}
    }
  },{
    type: 1,
    points: {
      A: {x: w/2, y: (h / 2) + v },
      B: {x: 0.0, y: h / 2},
      C: {x: w, y: h / 2}
    }
  }]

  for(i = 0; i < nSteps; i++) {
    triangles = subdivide(triangles);
    var mirroredTriangles = []
    triangles.forEach(function(t) {
      var p = t.points;
      var P = reflect(p.A, p.B, p.C);
      mirroredTriangles.push(newTriangle(t.type, P, p.B, p.C));
    });
    
    triangles = triangles.concat(mirroredTriangles);
  }

  triangles.map(function(t) {
    t.points = scalePoints(t.points);
    return t 
  });

  $('body').append('<div id="viz"></div>');

  svg = d3.select("#viz").append("svg")
        .attr("width", w)
        .attr("height", h);
 
  svg.selectAll("polygon")
    .data(triangles)
    .enter().append("polygon")
    .attr("points",function(d) {
        return Object.keys(d.points).map(function(key) {
          return [d.points[key].x,d.points[key].y].join(","); 
        }).join(" ");
    })
    .style('stroke', 'black')
    .style('stroke-width', '0.5')
    .attr("fill", function(d) {
      if (d.type == 0) {
        return "red";
      } else {
        return "blue";
      }
    })
}
