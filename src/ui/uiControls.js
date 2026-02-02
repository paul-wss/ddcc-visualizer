// ui controls and dom updates
import state from '../core/state.js';

// update group selector dropdown
export function updateGroupSelector() {
  const groupSelector = document.getElementById("groupSelector");
  groupSelector.innerHTML = '<option value="none">-Select group-</option>';

  state.pointGroups.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = group.name;

    if (state.currentGroup && state.pointGroups[index] === state.currentGroup) {
      option.selected = true;
    }

    groupSelector.appendChild(option);
  });
}
