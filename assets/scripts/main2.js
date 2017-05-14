var w,h,center,scale, gr, nSteps, svg, triangles, outerPaths, numOfAddedTriangles;
var drawArcsEnabled = true;
var CONST = 5;
var PI = Math.PI;

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

  $("#undo").click(undoNewTriangle);

  $("#drawArcs").bind('change', function(){        
    drawArcsEnabled = this.checked;
    d3.selectAll(".arcs").remove();

    if (drawArcsEnabled) {
      drawArcs(triangles);
    }
  });

  $("#mirrorTriangles").bind('change', function() {
    mirrorTriangles = this.checked;
    $("svg").remove();
    generatePenroseTiling();

  });
});

var rotateVector = function(vec, ang) {
    ang = -ang * (PI/180);
    var cos = Math.cos(ang);
    var sin = Math.sin(ang);
    return [vec[0] * cos - vec[1] * sin, vec[0] * sin + vec[1] * cos];
};

function toPolar(x) {
  return x * 2 * PI / 360;
}

function computeDistance(A,B) {
  return ((B.x - A.x)**2 + (B.y - A.y)**2)**(1/2);
}

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

function computeOuterPaths(triangles, updateTriangles = true) {
  var outerPaths = [];
  triangles.forEach(function(t) {
    Object.keys(t.edges).forEach(function(edge) {
      if (!t.edges[edge]) {
        return;
      }

      var newOuterLine;
      switch(edge) {
        case "AB":
          newOuterLine = {line: [t.points.A, t.points.B], lineType: "AB", t: t};
          break;
        case "BC":
          newOuterLine = {line: [t.points.B, t.points.C], lineType: "BC", t: t};
          break;
        case "AC":
          newOuterLine = {line: [t.points.A, t.points.C], lineType: "AC", t: t};
          break;
      }
      
      var element = outerPaths.find(function(oldOuteLine) {
        return (Math.abs(oldOuteLine.line[0].x - newOuterLine.line[0].x) < CONST && Math.abs(oldOuteLine.line[1].x - newOuterLine.line[1].x) < CONST && Math.abs(oldOuteLine.line[0].y - newOuterLine.line[0].y) < CONST && Math.abs(oldOuteLine.line[1].y - newOuterLine.line[1].y) < CONST) 
        || (Math.abs(oldOuteLine.line[1].x - newOuterLine.line[0].x) < CONST && Math.abs(oldOuteLine.line[0].x - newOuterLine.line[1].x) < CONST && Math.abs(oldOuteLine.line[1].y - newOuterLine.line[0].y) < CONST && Math.abs(oldOuteLine.line[0].y - newOuterLine.line[1].y) < CONST)
      });

      if (element) {
        if (updateTriangles) {
          element.t.edges[element.lineType] = false;
          t.edges[newOuterLine.lineType] = false;
        }
        var index = outerPaths.indexOf(element);
        if(index != -1)
            outerPaths.splice( index, 1 );
      } else {
        outerPaths.push(newOuterLine);
      }
    });
  });
  return outerPaths;
}

function computeNewTriangle(outerEdge, newType = 0) {
  var distance, A = {}, B = {}, C = {};
  var points = outerEdge.t.points;

  var vecAB = [points.B.x - points.A.x, points.B.y - points.A.y]
  var vecAC = [points.C.x - points.A.x, points.C.y - points.A.y]

  var vecBA = [points.A.x - points.B.x, points.A.y - points.B.y]
  var vecBC = [points.C.x - points.B.x, points.C.y - points.B.y]

  // var vecCA = [points.A.x - points.C.x, points.A.y - points.C.y]
  // var vecCB = [points.B.x - points.C.x, points.B.y - points.C.y]

  var angleAC_AB = Math.atan2(vecAC[1], vecAC[0]) - Math.atan2(vecAB[1], vecAB[0]);
  if (angleAC_AB < 0) angleAC_AB += 2 * PI;

  var angleBA_BC = Math.atan2(vecBA[1], vecBA[0]) - Math.atan2(vecBC[1], vecBC[0]);
  if (angleAC_AB < 0) angleAC_AB += 2 * PI;

  var rotatingAngle = newType == 0 ? 36 : 108;

  if (outerEdge.t.type == 0) {
    switch(outerEdge.lineType) {
      case "AB":
        newVec = rotateVector(vecAB, angleAC_AB > PI ? 360 - rotatingAngle : rotatingAngle);
        
        B.x = newVec[0] + outerEdge.t.points.A.x;
        B.y = newVec[1] + outerEdge.t.points.A.y;

        return newTriangle(newType, points.A, points.B, B, {AB: true, BC: false, AC: true})
      case "AC":
        newVec = rotateVector(vecAC, angleAC_AB < PI ? 360 - rotatingAngle : rotatingAngle);
        
        B.x = newVec[0] + outerEdge.t.points.A.x;
        B.y = newVec[1] + outerEdge.t.points.A.y;

        return newTriangle(newType, points.A, B, points.C, {AB: true, BC: false, AC: true})

    }
  } else {
    switch(outerEdge.lineType) {
      case "AB":
        newVec = rotateVector(vecAB, angleAC_AB > PI ? 360 - rotatingAngle : rotatingAngle);
        
        B.x = newVec[0] + outerEdge.t.points.A.x;
        B.y = newVec[1] + outerEdge.t.points.A.y;

        return newTriangle(newType, points.A, points.B, B, {AB: true, BC: false, AC: true})
      case "AC":

        newVec = rotateVector(vecAC, angleAC_AB < PI ? 360 - rotatingAngle : rotatingAngle);
        
        C.x = newVec[0] + outerEdge.t.points.A.x;
        C.y = newVec[1] + outerEdge.t.points.A.y;

        return newTriangle(newType, points.A, C, points.C, {AB: true, BC: false, AC: true})

    }
  }
}

function undoNewTriangle() {
  if (numOfAddedTriangles == 0) return;

  d3.selectAll('.triangles-' + numOfAddedTriangles).remove();
  d3.selectAll('path').remove();
  triangles.splice(-2,2);

  numOfAddedTriangles -= 1;

  outerPaths = computeOuterPaths(triangles, false);
  drawArcs(triangles);
  drawOuterPaths(outerPaths);
}

function initialTriangles() {
  var v =  (w / 2) * Math.tan(36 * PI / 180);

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

  triangles.map(function(t) {
    t.points = scalePoints(t.points);
    return t 
  });

  return triangles;
}

function drawArcs(triangles) {
  svg.selectAll()
    .data(triangles)
    .enter().append("path")
    .attr("d", function(t) {
      return getArc(t, 0)
    })
    .attr("class","arcs")
    .attr("fill", "none")
    .style('stroke', 'green')
    .style('stroke-width', '2')

  svg.selectAll()
    .data(triangles)
    .enter().append("path")
    .attr("d", function(t) {
      return getArc(t, 1)
    })
    .attr("class","arcs")
    .attr("fill", "none")
    .style('stroke', 'yellow')
    .style('stroke-width', '2')
}

function drawOuterPaths(outerPaths) {
  d3.selectAll('.outerPaths').remove();

  var line = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

  svg.selectAll()
    .data(outerPaths)
    .enter().append('path')
    .attr('class','outerPaths')
    .attr('d', function(d) { return line(d.line); })
    .attr('stroke-width', function(d) { return 3; })
    .attr('stroke', 'orange')
    .on("mouseover", function (d) {
      d3.select(this).attr('stroke-width', 6);
    })
    .on("mouseout", function(d) {
      d3.select(this).attr('stroke-width', 3);
    })
    .on("click", handleOnEdgeClick)
}

function drawTriangles(triangles) {
  svg.selectAll()
    .data(triangles)
    .enter().append("polygon")
    .attr("points",function(d) {
        return Object.keys(d.points).map(function(key) {
          return [d.points[key].x,d.points[key].y].join(","); 
        }).join(" ");
    })
    .attr("class", "triangles-" + numOfAddedTriangles)
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

function handleOnEdgeClick(d) {
  numOfAddedTriangles += 1;

  d3.select(this).remove();

  var newType = $('input[name=newType]:checked').val();
  t = computeNewTriangle(d, newType);

  if (!t) {
    return;
  }

  var P = reflect(t.points.A, t.points.B, t.points.C);

  var newTriangles = [t, newTriangle(t.type, P, t.points.B, t.points.C, {AB: true, BC: false, AC: true})];

  triangles = triangles.concat(newTriangles);

  drawTriangles(newTriangles);
  drawArcs(newTriangles);
  outerPaths = computeOuterPaths(triangles, false);
  drawOuterPaths(outerPaths);
}

function generatePenroseTiling() {
  numOfAddedTriangles = 0;
  
  triangles = initialTriangles();
  outerPaths = computeOuterPaths(triangles);

  for(i = 0; i < nSteps; i++) {
    triangles = subdivide(triangles);

    if (mirrorTriangles) {
      var mirroredTriangles = []
      triangles.forEach(function(t) {
        if (!t.edges.BC) {
          return;
        }
        t.edges.BC = false;

        var p = t.points;
        var P = reflect(p.A, p.B, p.C);
        mirroredTriangles.push(newTriangle(t.type, P, p.B, p.C, {AB: true, BC: false, AC: true}));
      });
      triangles = triangles.concat(mirroredTriangles);

      outerPaths = computeOuterPaths(triangles);
    }
  }

  $('body').append('<div id="viz"></div>');

  svg = d3.select("#viz").append("svg")
        .attr("width", w)
        .attr("height", h);
 
  
  drawTriangles(triangles);
  drawArcs(triangles);
  
  if (mirrorTriangles) {
    drawOuterPaths(outerPaths);
  }
  
}
