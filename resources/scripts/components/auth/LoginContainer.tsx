import { useStoreState } from 'easy-peasy';
import { Formik, Field, Form, FormikHelpers } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Reaptcha from 'reaptcha';
import { object, string } from 'yup';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, User2, LucideKeyRound, LucideEye, LucideEyeOff, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import login from '@/api/auth/login';
import useFlash from '@/plugins/useFlash';
import LogoLogin from '../elements/PyroLogoLogin';


interface Values {
  username: string;
  password: string;
}

function LoginContainer() {
  const ref = useRef<Reaptcha>(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const { clearFlashes, clearAndAddHttpError } = useFlash();
  const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const backgroundImage = 'https://images4.alphacoders.com/131/thumb-1920-1318503.jpeg';

  useEffect(() => {
    clearFlashes();
  }, [clearFlashes]);

  useEffect(() => {
    if (error) setShowErrorDialog(true);
  }, [error]);

  const onSubmit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
    clearFlashes();
    setError(null);

    try {
      if (recaptchaEnabled && !token) {
        await ref.current!.execute();
        return;
      }

      const response = await login({ ...values, recaptchaData: token });

      if (response.complete) {
        window.location.href = response.intended || '/';
      } else {
        navigate('/auth/login/checkpoint', { state: { token: response.confirmationToken } });
      }
    } catch (error: any) {
      console.error(error);
      setToken('');
      if (ref.current) {
        setTimeout(() => {
          ref.current?.reset();
        }, 500);
      }
      setError(error.message || 'An error occurred during login.');
      clearAndAddHttpError({ error });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backgroundBlendMode: 'overlay',
        }}
      >
        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={object().shape({
            username: string().required('A username or email must be provided.'),
            password: string().required('Please enter your account password.'),
          })}
          onSubmit={onSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="relative w-full max-w-[1000px] flex flex-col lg:flex-row items-center justify-center">
              <div className="hidden lg:block lg:absolute lg:-left-[200px] xl:-left-[0px] top-0">
                <img
                  src="https://sso.crunchyroll.com/_next/image?url=%2Fassets%2Fimages%2Fregister-hime.png&w=256&q=75"
                  alt="Login visual"
                  className="h-[400px] xl:h-[600px] w-auto object-contain animate-float"
                />
              </div>

              <Card className="w-full max-w-[450px] lg:max-w-[650px] bg-black border-black p-4 sm:p-6 lg:p-8">
                <CardHeader className="space-y-2">
                  <div className="flex justify-start mb-1">
                    <div className="w-10 h-10 sm:w-10 sm:h-10 lg:w-24 lg:h-24 transition-transform hover:scale-105">
                      <LogoLogin />
                    </div>
                  </div>
                  <CardTitle className="text-xl sm:text-3xl text-white">Login</CardTitle>
                  <CardDescription className="text-base sm:text-lg lg:text-xl mt-3 text-zinc-300">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-base sm:text-lg text-zinc-200">Username or Email</Label>
                    <div className="relative group">
                      <User2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-hover:text-white transition-colors" />
                      <Field
                        id="username"
                        name="username"
                        as={Input}
                        className="pl-10 h-12 w-full bg-zinc-900/50 border-zinc-700 focus:border-white transition-all text-white"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.username && touched.username && (
                      <p className="text-sm text-red-400">{errors.username}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base sm:text-lg text-zinc-200">Password</Label>
                    <div className="relative group">
                      <LucideKeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-hover:text-white transition-colors" />
                      <Field
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        as={Input}
                        className="pl-10 h-12 w-full bg-zinc-900/50 border-zinc-700 focus:border-white transition-all text-white"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
                        variant="ghost"
                      >
                        {showPassword ? (
                          <LucideEye className="h-4 w-4 text-zinc-500 hover:text-white transition-colors" />
                        ) : (
                          <LucideEyeOff className="h-4 w-4 text-zinc-500 hover:text-white transition-colors" />
                        )}
                      </Button>
                    </div>
                    {errors.password && touched.password && (
                      <p className="text-sm text-red-400">{errors.password}</p>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 mt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white hover:bg-zinc-200 text-black h-12 text-lg font-medium transition-all duration-300 hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>

                  {recaptchaEnabled && (
                    <Reaptcha
                      ref={ref}
                      size="invisible"
                      sitekey={siteKey || '_invalid_key'}
                      onVerify={(response) => {
                        setToken(response);
                      }}
                    />
                  )}
                </CardFooter>
              </Card>
            </Form>
          )}
        </Formik>
      </div>

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Error
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              {error}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => setShowErrorDialog(false)}
              variant="destructive"
            >
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default LoginContainer;