import { createSlice } from '@reduxjs/toolkit'

export const itemInteractionSlice = createSlice({
  name: 'itemInteraction',
  initialState: {
    selectedItems: [],
    hoveredItem: null
  },
  reducers: {
    setSelectedItems: (state, action) => {
      return {...state, selectedItems: action.payload}
    },
    setHoveredItem: (state, action) => {
      return {...state, hoveredItem: action.payload}
    },
  },
})

export const { setSelectedItems, setHoveredItem } = itemInteractionSlice.actions

export default itemInteractionSlice.reducer