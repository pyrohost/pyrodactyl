$(document).ready(() => {
	$("#pNodeId")
		.select2({
			placeholder: "Select a Node",
		})
		.change();

	$("#pAllocation").select2({
		placeholder: "Select a Default Allocation",
	});

	$("#pAllocationAdditional").select2({
		placeholder: "Select Additional Allocations",
	});
});

$("#pNodeId").on("change", function () {
	const currentNode = $(this).val();

	$.each(Pterodactyl.nodeData, (i, v) => {
		if (v.id == currentNode) {
			$("#pAllocation").html("").select2({
				data: v.allocations,
				placeholder: "Select a Default Allocation",
			});

			updateAdditionalAllocations();
		}
	});
});

$("#pAllocation").on("change", () => {
	updateAdditionalAllocations();
});

function updateAdditionalAllocations() {
	const currentAllocation = $("#pAllocation").val();
	const currentNode = $("#pNodeId").val();

	$.each(Pterodactyl.nodeData, (i, v) => {
		if (v.id == currentNode) {
			const allocations = [];

			for (let i = 0; i < v.allocations.length; i++) {
				const allocation = v.allocations[i];

				if (allocation.id != currentAllocation) {
					allocations.push(allocation);
				}
			}

			$("#pAllocationAdditional").html("").select2({
				data: allocations,
				placeholder: "Select Additional Allocations",
			});
		}
	});
}
