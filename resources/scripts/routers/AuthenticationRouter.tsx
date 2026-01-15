import { Route, Routes } from "react-router-dom";

import ForgotPasswordContainer from "@/components/auth/ForgotPasswordContainer";
import LoginCheckpointContainer from "@/components/auth/LoginCheckpointContainer";
import LoginContainer from "@/components/auth/LoginContainer";
import ResetPasswordContainer from "@/components/auth/ResetPasswordContainer";
import Logo from "@/components/elements/PyroLogo";
import { NotFound } from "@/components/elements/ScreenBlock";

const AuthenticationRouter = () => {
	return (
		<div
			className={
				"absolute w-full h-full flex justify-center items-center rounded-md [--page-padding:--spacing(8)]"
			}
		>
			<div
				style={{
					backgroundImage: "url(/assets/auth-noise.png)",
					backgroundSize: "1920px 1080px",
					backgroundRepeat: "repeat",
					backgroundPosition: "0 0",
				}}
				className="pointer-events-none fixed inset-0 z-1 opacity-[0.4]"
			></div>
			<div className="flex size-full">
				<div className="w-full max-w-4xl z-2 flex items-center bg-bg-lowered align-middle px-[calc(var(--page-padding)*3)]">
					<Routes>
						<Route path="login" element={<LoginContainer />} />
						<Route
							path="login/checkpoint/*"
							element={<LoginCheckpointContainer />}
						/>
						<Route path="password" element={<ForgotPasswordContainer />} />
						<Route
							path="password/reset/:token"
							element={<ResetPasswordContainer />}
						/>
						<Route path="*" element={<NotFound />} />
					</Routes>
				</div>
				<div className="w-full relative">
					<div className="flex items-center gap-4 h-6 absolute right-(--page-padding) top-(--page-padding) text-lg">
						<Logo className="h-full w-full flex inset-0" />
						<div className="border-l border-gray-200 h-full" />
						Games
					</div>

					{/* Gradients */}
					<div className="opacity-50">
						<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-brand-400/5 to-brand-600/10" />
						<div className="absolute inset-0 bg-gradient-to-tr to-transparent via-brand-400/5 from-brand-600/10" />
						<div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-500/13 to-transparent" />
					</div>
				</div>
			</div>
		</div>
	);
};

export default AuthenticationRouter;
