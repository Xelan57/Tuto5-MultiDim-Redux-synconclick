import * as d3 from 'd3';

class ScatterplotD3 {
    margin = {top: 100, right: 10, bottom: 50, left: 100};
    size;
    height;
    width;
    svg;
    brush;
    brushG;

    defaultOpacity = 0.3;
    transitionDuration = 1000;
    circleRadius = 3;
    xScale;
    yScale;

    constructor(el){
        this.el = el;
    };

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};

        // get the effect size of the view by subtracting the margin
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        // initialize the svg and keep it in a class property to reuse it in renderScatterplot()
        this.svg = d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class","svgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.xScale = d3.scaleLinear().range([0, this.width]);
        this.yScale = d3.scaleLinear().range([this.height, 0]);

        // build xAxisG
        this.svg.append("g")
            .attr("class","xAxisG")
            .attr("transform","translate(0," + this.height + ")");
        
        this.svg.append("g")
            .attr("class","yAxisG");


        // brush initialization
        this.brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]]);
        this.brushG = this.svg.append("g")
            .attr("class", "brush");
    }

    changeBorderAndOpacity(selection, selected){
        selection.style("opacity", selected ? 1 : this.defaultOpacity);

        selection.select(".markerCircle")
            .attr("stroke-width", selected ? 2 : 0);
    }

    updateMarkers(selection, xAttribute, yAttribute){
        // transform selection
        selection
            .transition().duration(this.transitionDuration)
            .attr("transform", (item)=>{
                // use scales to return shape position from data values
                return "translate(" + this.xScale(item[xAttribute]) + "," + this.yScale(item[yAttribute]) + ")";
            });
        this.changeBorderAndOpacity(selection, false);
    }

    highlightSelectedItems = function(selectedIds) {
        this.svg.selectAll(".markerCircle")
            .attr("fill", (d) => selectedIds.includes(d.index) ? "red" : "black")
            .attr("stroke", (d) => selectedIds.includes(d.index) ? "black" : "red")
            .attr("stroke-width", (d) => selectedIds.includes(d.index) ? 2 : 0)
    }

    highlightHoveredItem = function(hoveredItemId, selectedIds = []) {
        
        this.svg.selectAll(".markerCircle")
            .transition().duration(150)
            .attr("r", (d) => {
                if (d.index === hoveredItemId || selectedIds.includes(d.index)) return 8;
                return this.circleRadius;
            })
            .attr("fill", (d) => {
                if (d.index === hoveredItemId || selectedIds.includes(d.index)) return "red";
                return "black";
            })
            .attr("stroke", (d) => {
                if (d.index === hoveredItemId || selectedIds.includes(d.index)) return "black";
                return "red";
            })
            .attr("stroke-width", (d) => {
                if (d.index === hoveredItemId) return 3;
                if (selectedIds.includes(d.index)) return 2;
                return 0;
            });
    }

    updateAxis = function(visData, xAttribute, yAttribute){
        // compute min max using d3.min/max(visData.map(item=>item.attribute))
        const minX = d3.min(visData.map(item=>item[xAttribute]));
        const maxX = d3.max(visData.map(item=>item[xAttribute]));
        const minY = d3.min(visData.map(item=>item[yAttribute]));
        const maxY = d3.max(visData.map(item=>item[yAttribute]));
        
        this.xScale.domain([minX, maxX]);
        this.yScale.domain([minY, maxY]);

        // create axis with computed scales
        this.svg.select(".xAxisG")
            .transition().duration(500)
            .call(d3.axisBottom(this.xScale));
            
        this.svg.select(".yAxisG")
            .transition().duration(500)
            .call(d3.axisLeft(this.yScale));
    }


    renderScatterplot = function (visData, xAttribute, yAttribute, controllerMethods){
        console.log("render scatterplot with a new data list ...");

        // build the size scales and x,y axis
        this.updateAxis(visData, xAttribute, yAttribute);

        this.svg.selectAll(".markerG")
            .data(visData, (itemData) => itemData.index)
            .join(
                enter => {
                    const itemG = enter.append("g")
                        .attr("class","markerG")
                        .style("opacity", this.defaultOpacity)
                        .on("click", (event, itemData) => {
                            if(controllerMethods.handleOnClick)
                                controllerMethods.handleOnClick(itemData);
                        })
                        .on("mouseenter", (event, itemData) => {
                            if(controllerMethods.handleOnMouseEnter)
                                controllerMethods.handleOnMouseEnter(itemData);
                        })
                        .on("mouseleave", (event, itemData) => {
                            if(controllerMethods.handleOnMouseLeave)
                                controllerMethods.handleOnMouseLeave();
                        });

                    itemG.append("circle")
                        .attr("class","markerCircle")
                        .attr("r", this.circleRadius)
                        .attr("stroke","red");

                    this.updateMarkers(itemG, xAttribute, yAttribute);
                },
                update => {
                    this.updateMarkers(update, xAttribute, yAttribute);
                },
                exit => {
                    exit.remove();
                }
            );

        // brush events
        this.brush.on("start brush end", (event) => {
            if (!event.selection) {
                this.highlightSelectedItems([]);
                if(controllerMethods.handleBrush) controllerMethods.handleBrush([]);
                return;
            }

            // selected area
            const [[x0, y0], [x1, y1]] = event.selection;

            // get all points in the selected area
            const selectedItems = visData.filter(item => {
                const cx = this.xScale(item[xAttribute]);
                const cy = this.yScale(item[yAttribute]);
                return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
            });

            const selectedIds = selectedItems.map(item => item.index);
            this.highlightSelectedItems(selectedIds);

            if(controllerMethods.handleBrush) {
                controllerMethods.handleBrush(selectedItems);
            }
        });

        this.brushG.call(this.brush);
        this.svg.selectAll(".markerG").raise();
    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
    }
}

export default ScatterplotD3;