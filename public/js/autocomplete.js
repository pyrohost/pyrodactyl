// Hacky fix for browsers ignoring autocomplete="off"
$(document).ready(() => {
	$(".form-autocomplete-stop").on("click", function () {
		$(this).removeAttr("readonly").blur().focus();
	});
});
