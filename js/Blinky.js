
var tool = null;

function getClockTime() {
    return new Date().getTime() / 1000.0;
}

var Light_num = 0;
class Light extends CanvasTool.Graphic {
    constructor(opts) {
        opts.id = opts.id || Light_num++;
        super(opts);
        this.vx = 0;
        this.vy = 0;
        this.radius = 5;
        this.rgb = [100,200,30];
    }

    static reset() {
        Light_num = 0;
    }

    tick() {
    }

    onClick(e) {
        this.happiness = 0;
        if (e.shiftKey)
            this.happiness = 1;
    }

    adjustPosition() {
        if (0) {
            var s = 6;
            this.x += s*(Math.random() - 0.5);
            this.y += s*(Math.random() - 0.5);
        }
        else {
            var s = 1;
            this.vx += s*(Math.random() - 0.5);
            this.vy += s*(Math.random() - 0.5);
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= .9;
            this.vy *= .9;
        }
    }

    setState(rgb) {
        this.rgb = rgb;
        var r,g,b;
        [r,g,b] = this.rgb;
        this.fillStyle = sprintf("rgb(%d,%d,%d)", r,g,b);
    }

    adjustState() {
        var s =3;
        for (var i=0; i<3; i++) {
            var x = this.rgb[i];
            this.rgb[i] = Math.floor(x + s*(Math.random())) % 256;
        }
        this.setState(this.rgb);
     }
}

class Link extends CanvasTool.Graphic {
    constructor(opts) {
        super(opts);
        this.id1 = opts.id1;
        this.id2 = opts.id2;
    }

    draw(canvas, ctx) {
        //console.log("Link.draw");
        var a1 = tool.getGraphic(this.id1);
        var a2 = tool.getGraphic(this.id2);
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillStyle = this.fillStyle;
        ctx.beginPath();
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(a2.x, a2.y);
        ctx.fill();
        ctx.stroke();
    }
}


class Blinky extends CanvasTool {
    constructor(canvasName) {
        super(canvasName);
        tool = this;
        this.background = "#111";
        this.distThresh = 50;
        this.numLights = 40;
        this.harmony = 50;
        this.run = true;
        this.grid = true;
        this.style = "spiral"
        this.mobile = false;
        this.speed = 1;
        this.playTime = 0;
        this.prevClockTime = getClockTime();
        this.prevStepTime = 0;
        this.setupDATGUI();
        this.initBlinky();
    }

    setupDATGUI()
    {
        var P = this;
        var gui = new dat.GUI();
        gui.add(P, 'numLights', 2, 1000);
        gui.add(P, 'distThresh', 0, 200);
        gui.add(P, 'harmony', 0, 100);
        //gui.add(P, 'run');
        gui.add(P, "speed", 0, 10);
        gui.add(P, 'style', ['grid', 'random', 'spiral']).onChange(() => P.reset());
        gui.add(P, 'reset');
    }

    reset() {
        this.initBlinky();
    }

    add(x, y, id) {
         var light = new Light({x, y});
        this.lights[light.id] = light;
        this.lightVec.push(light);
        this.addGraphic(light);
        return light;
    }

    addLink(id1, id2) {
        var link = new Link({id: "link"+this.numLinks++, id1, id2});
        this.links[[id1,id2]] = link;
        this.addGraphic(link);
    }

    connect(id1, id2) {
        this.links[[id1,id2]] = true;
    }

    distBetween(id1, id2) {
        var a1 = this.lights[id1];
        var a2 = this.lights[id2];
        var dx = a1.x-a2.x;
        var dy = a1.y-a2.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    initBlinky() {
        tool = this;
        super.init();
        this.setView(300, 300, 800)
        Light.reset();
        this.playTime = 0;
        this.prevClockTime = getClockTime();
        this.prevStepTime = 0;
        this.stepNum = 0;
        this.numLinks = 0;
        this.lights = {};
        this.lightVec = [];
        this.links = {};
        this.initPositions();
        //console.log("*** graphics:", this.graphics);
    }

    initPositions() {
        var style = this.style;
        console.log("initPositions:", style);
        if (style == "spiral") {
            return this.initSpiral();
        }
        if (style == "grid") {
            return this.initGrid();
        }
        if (style == "random") {
            return this.initRand();
        }
        alert("Unrecognized style "+style);
    }

    initSpiral() {
        var x0 = 250;
        var y0 = 250;

        var a = .6;
        var b = 10;
        var prev = null;
        for (var i=0; i < this.numLights; i++) {
            var t = a*i;
            var r = b*t;
            var x = x0 + r*Math.cos(a*t);
            var y = y0 + r*Math.sin(a*t);
            var node = this.add(x, y, i);
            if (prev) {
                this.addLink(node.id, prev.id);
            }
            prev = node;
        }
    }

    initTree() {
        var node = this.add(100, 100, 0);
        this.i0 = 1;
        var N = this.numLights;
        this.addChildren(node, 1, 3);
    }

    addChildren(parent, level, maxLevel) {
        var x = parent.x - 30;
        var y = parent.y + 100;
        for (var i=0; i<nChildren; i++) {
            var N = Math.floor(sizes[i]);
            if (this.i0 >= this.numLights)
                return;
            var node = this.add(x,y, this.i0);
            this.connect(parent.id, node.id);
            nodes.push(node);
            x += 10;
            i += 1;
        }
        return i;
    }

    initGrid() {
        var n = Math.sqrt(this.numLights);
        n = Math.floor(n);
        var W = 600;
        var H = 600;
        var w = W / n;
        var h = H / n;
        for (var i=0; i<this.numLights; i++) {
            var j = Math.floor(i/n);
            var k = i % n;
            var x = j * w;
            var y = k * h;
            this.add(x,y,i);
        }
    }

    initRand() {
        var W = 600;
        var H = 600;
        for (var i=0; i<this.numLights; i++) {
            var x = Math.random()*W;
            var y = Math.random()*H;
            this.add(x, y, i);
        }
    }

    adjustStates0() {
        for (var id in this.lights)
            this.lights[id].adjustState();
    }

    adjustStates() {
        //var lights = Object.values(this.lights);
        var lights = this.lightVec;
        lights[this.numLights-1].adjustState();
        //for (var i=0; i<this.numLights; i++) {
        //    lights[i].adjustState();
        //}
        for (var i=0; i<this.numLights-1; i++) {
            //lights[i].setState(lights[i+1].rgb);
            var r,g,b;
            [r,g,b] = lights[i+1].rgb;
            lights[i].setState([r,g,b]);
        }
    }

    adjustPositions() {
        for (var id in this.lights)
            this.lights[id].adjustPosition();
    }

    computeLinks(maxDist) {
        this.links = {};
        for (var i1 in this.lights) {
            for (var i2 in this.lights) {
                if (this.distBetween(i1,i2) < maxDist)
                    this.connect(i1,i2);
           }
        }
    }

    drawLinks() {
        var ctx = this.canvas.getContext('2d');
        this.setTransform(ctx);
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.strokeStyle;
        //ctx.fillStyle = this.fillStyle;
        ctx.fillStyle = this.null;
        ctx.beginPath();
        for (var id1 in this.lights) {
            var a1 = this.lights[id1];
            for (var id2 in this.lights) {
                if (!this.links[[id1,id2]])
                    continue;
                var a2 = this.lights[id2];
                ctx.moveTo(a1.x, a1.y);
                ctx.lineTo(a2.x, a2.y);
            }
        }
        ctx.stroke();
    }

    draw() {
        super.clearCanvas();
        this.drawLinks();
        super.drawGraphics();
    }

    getNumLights() {
        return Object.keys(this.lights).length;
    }

    tick() {
        //console.log("tick...");
        var t = getClockTime();
        var dt = t - this.prevClockTime;
        this.prevClockTime = t;
        this.playTime += this.speed * dt;
        var det = this.playTime - this.prevStepTime;
        console.log(sprintf("pt: %7.1f det: %.1f", this.playTime, det));
        if (det < 1.0)
            return;
        this.prevStepTime = this.playTime;
       // if (!this.run)
       //     return;
        this.stepNum++;
        if (this.mobile)
            this.adjustPositions();
        this.adjustStates();
        //this.computeLinks(this.distThresh);
        this.draw();
        for (var id in this.lights)
            this.lights[id].tick();
        var str = sprintf("N: %3d NumLights: %3d",
                this.stepNum, this.getNumLights())
        $("#stats").html(str);
    }

    start() {
        console.log("Blinky.start");
        this.init();
        this.initBlinky();
        this.tick();
        let inst = this;
        setInterval(() => inst.tick(), 20);
    }
 }

