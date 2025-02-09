import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-black">Privacy Policy </h1>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-black">1. Information We Collect</h2>
          <p className="text-black">
            We collect information that you provide directly to us, including when you create an account,
            make a purchase, or contact us for support. This means during login process we collect the informatio 
            you let us collect like emails. (Your passwords ARE NOT collected during any login process )
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-black">2. How We Use Your Information</h2>
          <p className="text-black">
            We use the information we collect to provide, maintain, and improve our services,
            to process your transactions, and to communicate with you. Your email will never be sold nor used for anything else.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-black">3. Information Sharing</h2>
          <p className="text-black">
            We do not sell, trade, or otherwise transfer your personally identifiable information
            to third parties. Do not worry about your data being shared with anyone.
            </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-black">4. Data Security</h2>
          <p className="text-black">
            We implement appropriate security measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction. We recommend daily 
            backups to ensure your data is safe. All data store is encrpyted when stored our databases.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-black">4. Servers hosted on our network</h2>
          <p className="text-black">
            We implement appropriate security measures to protect your personal information hosted on our servers,
            but We do daily check ups on our servers to verfiy nothing illegal is happening on our servers.
            
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-black">5. Contact Us</h2>
          <p className="text-black">
            If you have any questions about this Privacy Policy, please contact us. udayanthie.work@gmail.com / help@nadhi.dev / contact.ryx.us
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;