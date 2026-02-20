import './CirclePack.css';
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import CirclePackD3 from './CirclePackD3';

// TODO: import action methods from reducers
import { setSelectedItems, setHoveredItem } from '../../redux/ItemInteractionSlice';

function CirclePackContainer({ xAttributeName, yAttributeName }) {
    const visData = useSelector(state => state.dataSet);
    const selectedItems = useSelector(state => state.itemInteraction.selectedItems);
    const hoveredItem = useSelector(state => state.itemInteraction.hoveredItem);
    const dispatch = useDispatch();

    // every time the component re-render
    useEffect(() => {
        console.log("CirclePackContainer useEffect (called each time matrix re-renders)");
    }); // if no second parameter, useEffect is called at each re-render

    const divContainerRef = useRef(null);
    const circlePackD3Ref = useRef(null);

    const getChartSize = function () {
        let width;
        let height;
        if (divContainerRef.current !== undefined && divContainerRef.current !== null) {
            width = divContainerRef.current.offsetWidth;
            height = divContainerRef.current.offsetHeight;
        }
        return { width: width, height: height };
    }

    // did mount called once the component did mount
    useEffect(() => {
        console.log("CirclePackContainer useEffect [] called once the component did mount");
        const circlePackD3 = new CirclePackD3(divContainerRef.current);
        
        const size = getChartSize();
        circlePackD3.create({ 
            size: { width: size.width || 800, height: size.height || 600 } 
        });
        
        circlePackD3Ref.current = circlePackD3;
        
        return () => {
            // did unmout, the return function is called once the component did unmount
            console.log("CirclePackContainer useEffect [] return function, called when the component did unmount...");
            const circlePackD3 = circlePackD3Ref.current;
            if (circlePackD3) {
                circlePackD3.clear();
            }
        }
    }, []); // if empty array, useEffect is called after the component did mount (has been created)

    // did update, called each time dependencies change, dispatch remain stable over component cycles
    useEffect(() => {
        console.log("CirclePackContainer useEffect with dependency [visData, xAttributeName, yAttributeName, dispatch], called each time data changes...");

        const handleOnClick = function (itemData) {
            dispatch(setSelectedItems([itemData]));
        }
        const handleOnMouseEnter = function (itemData) {
            dispatch(setHoveredItem(itemData));
        }
        const handleOnMouseLeave = function () {
            dispatch(setHoveredItem(null));
        }

        const controllerMethods = {
            handleOnClick,
            handleOnMouseEnter,
            handleOnMouseLeave
        }

        // get the current instance of circlePackD3 from the Ref...
        const circlePackD3 = circlePackD3Ref.current;
        
        // call renderPack of CirclePackD3...;
        circlePackD3.renderPack(visData,'state', xAttributeName, yAttributeName, controllerMethods);
        
    }, [visData, xAttributeName, yAttributeName, dispatch]); // if dependencies, useEffect is called after each data update

    useEffect(() => {
        const circlePackD3 = circlePackD3Ref.current;
        if (circlePackD3 && selectedItems) {
            const selectedIds = selectedItems.map(item => item.index);
            circlePackD3.highlightSelectedItems(selectedIds);
        }
    }, [selectedItems]);

    useEffect(() => {
        const circlePackD3 = circlePackD3Ref.current;
        if (circlePackD3) {
            const hoveredId = hoveredItem ? hoveredItem.index : null;
            circlePackD3.highlightHoveredItem(hoveredId);
        }
    }, [hoveredItem]);

    return (
        <div ref={divContainerRef} className="circlePackDivContainer col2">
            
        </div>
    )
}

export default CirclePackContainer;