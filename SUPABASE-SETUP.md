# 🚀 Supabase Setup Guide for Spice AI

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **OpenAI API Key**: Get one from [platform.openai.com](https://platform.openai.com)
3. **Supabase CLI** (optional): For local development

## 🎯 Step-by-Step Setup

### 1. Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)** and sign in
2. **Click "New Project"**
3. **Choose your organization**
4. **Enter project details**:
   - Name: `spice-ai`
   - Database Password: Choose a strong password
   - Region: Choose closest to your users
5. **Click "Create new project"**
6. **Wait for setup to complete** (2-3 minutes)

### 2. Set Up Database Schema

1. **Go to your project dashboard**
2. **Click "SQL Editor"** in the left sidebar
3. **Copy and paste the contents** of `supabase-schema.sql`
4. **Click "Run"** to execute the schema

### 3. Configure Authentication

1. **Go to "Authentication" → "Settings"**
2. **Enable Email Auth** (if not already enabled)
3. **Configure Site URL**: Add your app's URL
4. **Save changes**

### 4. Deploy Edge Functions

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

4. **Deploy the functions**:
   ```bash
   supabase functions deploy generate-replies
   supabase functions deploy analyze-image
   ```

### 5. Set Environment Variables

1. **Go to "Settings" → "API"**
2. **Copy your project URL and anon key**
3. **Go to "Settings" → "Edge Functions"**
4. **Add these secrets**:
   - `OPENAI_API_KEY`: Your OpenAI API key

### 6. Update Your Mobile App

1. **Get your Supabase credentials**:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: Found in Settings → API

2. **Update the mobile app configuration**:
   - Replace `YOUR_SUPABASE_URL` with your project URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your anon key

## 🔧 Configuration Files

### Environment Variables
Create a `.env` file in your project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Update Mobile App API Calls
The mobile app needs to be updated to use Supabase functions instead of the old API endpoints.

## 🧪 Testing

1. **Test Authentication**:
   - Try signing up with email
   - Check if user is created in the database

2. **Test Edge Functions**:
   - Use the Supabase dashboard to test functions
   - Check function logs for errors

3. **Test Mobile App**:
   - Update the app with new Supabase credentials
   - Test reply generation
   - Test image analysis

## 🔒 Security Notes

- **Row Level Security (RLS)** is enabled on all tables
- **Users can only access their own data**
- **Edge Functions validate JWT tokens**
- **API keys are stored securely in Supabase secrets**

## 📱 Mobile App Integration

The mobile app needs to be updated to:
1. **Use Supabase Auth** for authentication
2. **Call Edge Functions** instead of local API endpoints
3. **Handle Supabase responses** properly

## 🆘 Troubleshooting

### Common Issues:
1. **CORS errors**: Check Edge Function CORS headers
2. **Authentication errors**: Verify JWT token handling
3. **Function deployment fails**: Check Supabase CLI version
4. **Database connection errors**: Verify project URL and keys

### Getting Help:
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Discord Community**: [supabase.com/discord](https://supabase.com/discord)
- **GitHub Issues**: [github.com/supabase/supabase](https://github.com/supabase/supabase)

## 🎉 Next Steps

After setup:
1. **Test all functionality**
2. **Deploy your updated mobile app**
3. **Monitor usage and performance**
4. **Scale as needed**

Your Spice AI app will now have a fully functional backend with:
- ✅ **User authentication**
- ✅ **Database storage**
- ✅ **AI reply generation**
- ✅ **Image analysis**
- ✅ **Scalable infrastructure**
