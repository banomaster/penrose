$(function(){
  gr = (1 + Math.sqrt(5)) / 2 //golder ration

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

  var w = window.innerWidth;
  var h = window.innerHeight;

  var width = w,
    height = h;

  var v =  (w / 2) * Math.tan(36 * Math.PI / 180);

  var triangles = [{
    type: 1,
    points: {
      A: {x: w/2, y: (h / 2) - v },
      B: {x: 0.0, y: h / 2},
      C: {x: w, y: h / 2}
    }
  }, {
    type: 1,
    points: {
      A: {x: w/2, y: (h / 2) + v },
      B: {x: 0.0, y: h / 2},
      C: {x: w, y: h / 2}
    }
  }]

  for(i = 0; i < 12; i++) {
    triangles = subdivide(triangles);
  }

 
  var svg = d3.select("#viz").append("svg")
        .attr("width", width)
        .attr("height", height);
 
  svg.selectAll("polygon")
    .data(triangles)
    .enter().append("polygon")
    .attr("points",function(d) {
          return Object.keys(d.points).map(function(key) {
            return [d.points[key].x,d.points[key].y].join(","); 
          }).join(" ");
    })
    .attr("fill", function(d) {
      if (d.type == 0) {
        return "red";
      } else {
        return "blue";
      }
    })
    
    
});
