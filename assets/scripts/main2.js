var w,h,center,scale, gr, nSteps, svg;

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

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

function sumOfPoints(A, B) {
  return {x: A.x + B.x, y: A.y + B.y}
}

function diffOfPoints(A, B) {
  return {x: A.x - B.x, y: A.y - B.y}
}

function multOfPoint(A, x) {
  return {x: A.x * x, y: A.y * x}
}

function absOfPoint(A) {
  return Math.sqrt(Math.pow(A.x,2) + Math.pow(A.y,2))
}

function crossPoints(A, B) {
  return A.x * B.y - A.y * B.x
}

function getArc(t, type) {
  var A = t.points.B;
  var B = t.points.A;
  var C = t.points.C;

  var D = sumOfPoints(diffOfPoints(A, B), C)
  if (type == 0) {
    return getArcD(A, B, D)
  } else {
    return getArcD(C, B, D)
  }
}

function getArcD(U, V, W) {
  var start = multOfPoint(sumOfPoints(U,V),0.5)
  var UN = diffOfPoints(sumOfPoints(V,W),multOfPoint(U, 2))

  var r = absOfPoint(multOfPoint(diffOfPoints(V, U), 0.5))

  var end = sumOfPoints(U, multOfPoint(multOfPoint(UN, r), 1 / absOfPoint(UN)))
      
  var US = diffOfPoints(start, U)
  var UE = diffOfPoints(end, U)

  if (crossPoints(US, UE) > 0) {
    start = end
    end = multOfPoint(sumOfPoints(U,V),0.5)
  }
  
  return "M {0} {1} A {2} {3} 0 0 0 {4} {5}".format(start.x, start.y,
                                              r, r, end.x, end.y)
}


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

function newTriangle(type, A, B, C, edges) {
  return {type: type, points: {A: A, B: B, C: C}, edges: edges};
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
      newTriangles.push(newTriangle(0, p.C, P, p.B, {AB: false, BC: t.edges.AB, AC: t.edges.BC}));
      newTriangles.push(newTriangle(1, P, p.C, p.A, {AB: false, BC: t.edges.AC, AC: t.edges.AB}));
    } else {
      // subdivide 1 type
      var Q = computeNewPoint(p.B, p.A);
      var R = computeNewPoint(p.B, p.C);
      newTriangles.push(newTriangle(1, R, p.C, p.A, {AB: t.edges.BC, BC: t.edges.AC, AC: false}));
      newTriangles.push(newTriangle(1, Q, R, p.B, {AB: false, BC: t.edges.BC, AC: t.edges.AB}));
      newTriangles.push(newTriangle(0, R, Q, p.A, {AB: false, BC: t.edges.AB, AC: false}));
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
    },
    edges: {
      AB: true,
      BC: false,
      AC: true
    }
  },{
    type: 1,
    points: {
      A: {x: w/2, y: (h / 2) + v },
      B: {x: 0.0, y: h / 2},
      C: {x: w, y: h / 2}
    },
    edges: {
      AB: true,
      BC: false,
      AC: true
    }
  }]

  var points = []

  for(i = 0; i < nSteps; i++) {
    triangles = subdivide(triangles);
    var mirroredTriangles = []
    triangles.forEach(function(t) {
      if (!t.edges.BC) {
        return;
      }

      var p = t.points;
      var P = reflect(p.A, p.B, p.C);
      mirroredTriangles.push(newTriangle(t.type, P, p.B, p.C, {AB: true, BC: false, AC: true}));
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

  var pi = Math.PI;
    
  var arc = d3.svg.arc()
      .innerRadius(50)
      .outerRadius(70)
      .startAngle(45 * (pi/180)) //converting from degs to radians
      .endAngle(3) //just radians
 
  svg.selectAll()
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

  svg.selectAll()
    .data(triangles)
    .enter().append("path")
    .attr("d", function(t) {
      return getArc(t, 0)
    })
    .attr("fill", "none")
    .style('stroke', 'green')
    .style('stroke-width', '2')

  svg.selectAll()
    .data(triangles)
    .enter().append("path")
    .attr("d", function(t) {
      return getArc(t, 1)
    })
    .attr("fill", "none")
    .style('stroke', 'yellow')
    .style('stroke-width', '2')

}
