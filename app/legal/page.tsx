import Nav from '@/components/Nav';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-off-white dark:bg-brutal-black transition-colors duration-300">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-brutal text-4xl md:text-6xl mb-8 uppercase border-b-[4px] border-black pb-4 dark:text-acid-yellow">
          Legal & Policies
        </h1>

        <div className="space-y-12 font-mono text-sm md:text-base leading-relaxed opacity-90">
          
          {/* TERMS AND CONDITIONS */}
          <section id="terms" className="panel-brutal bg-white p-6 md:p-8">
            <h2 className="font-brutal text-2xl mb-4 text-hot-pink uppercase">1. Terms and Conditions</h2>
            <p className="mb-4">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
            <p className="mb-4">
              Welcome to The Sus Files ("the Application"). By accessing or using the Application, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use the Application.
            </p>
            <h3 className="font-bold mb-2">1.1 Use of the Application</h3>
            <p className="mb-4">
              The Sus Files is provided as a private, invite-only platform for users to share and document content ("Evidence") relating to their friends ("Suspects"). You are solely responsible for your conduct and any data, text, files, information, usernames, images, graphics, photos, profiles, audio and video clips, sounds, musical works, works of authorship, applications, links and other content or materials that you submit, post or display on or via the Application.
            </p>
            <h3 className="font-bold mb-2">1.2 Acceptable Use</h3>
            <p className="mb-4">
              You agree not to use the Application for any illegal or unauthorized purpose. You agree to comply with all laws, rules, and regulations applicable to your use of the Application. Harassment, threats, bullying, or the distribution of non-consensual explicit content will result in immediate termination of access.
            </p>
            <h3 className="font-bold mb-2">1.3 Termination</h3>
            <p>
              We reserve the right to modify or terminate the Application or your access to the Application for any reason, without notice, at any time, and without liability to you.
            </p>
          </section>

          {/* PRIVACY POLICY */}
          <section id="privacy" className="panel-brutal bg-acid-yellow p-6 md:p-8 text-black">
            <h2 className="font-brutal text-2xl mb-4 text-electric-blue uppercase">2. Privacy Policy</h2>
            <p className="mb-4">
              Your privacy is critically important to us. This Privacy Policy outlines how your personal information is collected, used, and protected.
            </p>
            <h3 className="font-bold mb-2">2.1 Information We Collect</h3>
            <p className="mb-4">
              When you use The Sus Files, we collect information you provide directly to us. This includes your account information (such as your Google profile data, email, and display name), as well as the content you upload, including photos, audio, video, and text captions.
            </p>
            <h3 className="font-bold mb-2">2.2 How We Use Your Information</h3>
            <p className="mb-4">
              We use the information we collect to provide, maintain, and improve the Application. Because this is a private archive, your uploaded content is visible only to other authenticated users who have been granted access to your specific deployment of the Application. We do not sell your personal data to third parties.
            </p>
            <h3 className="font-bold mb-2">2.3 Data Storage</h3>
            <p>
              Your data is stored securely using cloud infrastructure providers (Firebase and ImgBB). By uploading media, you consent to the storage and processing of your data by these third-party services in accordance with their respective privacy policies.
            </p>
          </section>

          {/* COPYRIGHT */}
          <section id="copyright" className="panel-brutal bg-black text-white p-6 md:p-8">
            <h2 className="font-brutal text-2xl mb-4 text-lime-green uppercase">3. Copyright & Intellectual Property</h2>
            <p className="mb-4">
              <strong>© {new Date().getFullYear()} GHOST. All rights reserved.</strong>
            </p>
            <p className="mb-4">
              The Sus Files, including its original code, design elements, branding, and architectural structure, are the exclusive property of GHOST. Unauthorized reproduction, distribution, or commercialization of the Application's source code without explicit permission is strictly prohibited.
            </p>
            <h3 className="font-bold mb-2">3.1 User-Generated Content</h3>
            <p className="mb-4">
              You retain all ownership rights to the content you upload to The Sus Files. However, by submitting content, you grant the Application a worldwide, non-exclusive, royalty-free license to use, reproduce, display, and distribute your content strictly for the purpose of operating and providing the Application's core functionality to you and your authorized peers.
            </p>
            <h3 className="font-bold mb-2">3.2 DMCA & Takedown Requests</h3>
            <p>
              If you believe that material hosted on the Application infringes on your copyright, you may submit a takedown request. The administrator of this instance is responsible for the removal of infringing content.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
