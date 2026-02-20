import * as d3 from 'd3';

class CirclePackD3 {
    margin = {top: 20, right: 20, bottom: 20, left: 20};
    size;
    height;
    width;
    svg;
    g;
    
    defaultOpacity = 0.8;
    colorScale;

    constructor(el){
        this.el = el;
    }

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};

        // get the effect size of the view by subtracting the margin
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        // svg init
        this.svg = d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);
            
        this.g = this.svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        // colorScale init
        this.colorScale = d3.scaleLinear();
    }

    renderPack = function (visData, stateAttr, populationAttr, crimeAttr, controllerMethods) {
        console.log("render circle pack...");

        // updating color scale domain to match the crime attribute
        const crimeExtent = d3.extent(visData, d => +d[crimeAttr]);

        const min = crimeExtent[0];
        const max = crimeExtent[1];

        const mid = (min + max) / 2;

        this.colorScale
            .domain([min, mid, max])
            .range(["#2ca02c", "#ffcc00", "#d62728"]);

        // transforming flat data into a hierarchy 
        const groupedData = d3.group(visData, d => d[stateAttr]);
        const hierarchyData = {
            name: "USA",
            children: Array.from(groupedData, ([state, communities]) => ({
                name: state,
                children: communities
            }))
        };

        // init d3 hierarchy
        const root = d3.hierarchy(hierarchyData)
            .sum(d => +d[populationAttr] || 0)
            .sort((a, b) => b.value - a.value);

        const packLayout = d3.pack()
            .size([this.width, this.height])
            .padding(3);
        
        packLayout(root);

        const nodes = this.g.selectAll(".nodeG")
            .data(root.descendants(), d => d.data.index || d.data.name);

        nodes.join(
            enter => {
                const nodeG = enter.append("g")
                    .attr("class", d => d.children ? "nodeG node-parent" : "nodeG node-leaf")
                    .attr("transform", d => `translate(${d.x},${d.y})`)
                    .on("click", (event, d) => {
                        if (!d.children && controllerMethods?.handleOnClick)
                            controllerMethods.handleOnClick(d.data);
                    })
                    .on("mouseenter", (event, d) => {
                        if (!d.children && controllerMethods?.handleOnMouseEnter)
                            controllerMethods.handleOnMouseEnter(d.data);
                    })
                    .on("mouseleave", (event, d) => {
                        if (!d.children && controllerMethods?.handleOnMouseLeave)
                            controllerMethods.handleOnMouseLeave();
                    });

                nodeG.append("circle")
                    .attr("class", "nodeCircle")
                    .attr("r", 0)
                    .attr("fill", d => d.children ? "#e0e0e0" : this.colorScale(+d.data[crimeAttr]))
                    .attr("stroke", d => d.children ? "#ccc" : "none")
                    .style("opacity", this.defaultOpacity)
                    .transition().duration(1000)
                    .attr("r", d => d.r);
            },
            update => {
                update.transition().duration(1000)
                    .attr("transform", d => `translate(${d.x},${d.y})`)
                    .select("circle")
                    .attr("r", d => d.r)
                    .attr("fill", d => d.children ? "#e0e0e0" : this.colorScale(+d.data[crimeAttr]));
            },
            exit => {
                exit.transition().duration(500)
                    .select("circle").attr("r", 0);
                exit.transition().duration(500).remove();
            }
        );
    }

    highlightSelectedItems = function(selectedItemIds) {
        const isBrushActive = selectedItemIds && selectedItemIds.length > 0;

        this.g.selectAll(".node-leaf circle")
            .style("opacity", (d) => {
                if (!isBrushActive) return this.defaultOpacity;
                return selectedItemIds.includes(d.data.index) ? 1 : 0.1;
            })
            .attr("stroke", (d) => {
                if (!isBrushActive) return "none";
                return selectedItemIds.includes(d.data.index) ? "#000" : "none";
            })
            .attr("stroke-width", (d) => {
                if (!isBrushActive) return 0;
                return selectedItemIds.includes(d.data.index) ? 2 : 0;
            });
    }

    highlightHoveredItem = function(hoveredItemId) {
        this.g.selectAll(".node-leaf circle")
            .attr("stroke", (d) => d.data.index === hoveredItemId ? "black" : "none")
            .attr("stroke-width", (d) => d.data.index === hoveredItemId ? 4 : 0);
    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
    }
}

export default CirclePackD3;