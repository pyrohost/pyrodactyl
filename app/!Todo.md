Add inerstia to Login Controller //fixed
Add Ziggy JS //later
Fix the password controller //fixed


2025

Simple CDN for images and etc

Ability to change the code used in server list and etc (Coustamizablity) for different looks

Ability to change layout

Ability to change Colors on certain pages 

Ability to show and not show SHOP

Server Creator



# Use this Alert Dialog 

<AlertDialog open={showError}  onOpenChange={setShowError}>
        <AlertDialogContent className="max-w-[425px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                <LucideAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold">Error during transaction</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-4 text-base">{flash.error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


# Sucess version of this


<AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
      <AlertDialogContent className="max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
              <LucideCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold">
              {flash?.success?.title || 'Success'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4 text-base">
            {flash?.success?.desc || 'Operation completed successfully'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>






curl "https://127.0.0.1:8000/api/application/users" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer ptla_RG6XnTHYOYaMEpULTym7M90KPrjT0wVVeaCdzf7fOOF' \
  -X GET 
  
