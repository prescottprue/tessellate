# Run Your Own Instance of tessellate

**WARNING:**
This is advanced, and is only necessary if you don't want to use [tessellate.kyper.io](http://tessellate.kyper.io), which is an already hosted version of this server.

Tessellate includes a [NodeJS](http://nodejs.org) server that hosts the front end and provides the [REST API](http://tessellate.kyper.io/docs/index.html). Tessellate is built so that you can easily create and run your own contained instance of the Tessellate API server.

## Environment Variables
In order for the server to function correctly you must set the following environment variables. On mac that means adding them to your `~/.bash_profile` file or other bash profile you may have setup.

* **NODE_ENV** - Environment that node will operate within. (production, staging, development, or local)
* **TESSELLATE_JWT_SECRET** - Secret for JWT signing/validation
* **TESSELLATE_MONGO**
* **TESSELLATE_AWS_KEY**
* **TESSELLATE_AWS_SECRET** - AWS Secret
* **LOGGLY_TOKEN** - Loggly external logging token (external logging disabled if not provided.) NodeJS logs are also available through AWS Elastic Beanstalk UI, so external logging is not necessary to view logs. `NOT REQUIRED`
* **TESSELLATE_DEV_MONGO** - Development Mongo database. `NOT REQUIRED`

### Local Development Mode
1. Set NODE_ENV environment variable to `local`
2. Run local mongo instance using `mongod`

*More Coming Soon*

## Run Locally
1. Clone repository by running `git clone git@github.com:KyperTech/tessellate.git`
2. Install dependencies with `npm install`
3. Start local Node server with `npm start`
4. Visit [localhost:4000](http://localhost:4000) to view UI.

## Running a hosted version
### Amazon Elastic Beanstalk
1. [Signup for an AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html?nc2=h_ct) if you don't already have one.
2. Visit the [AWS console](https://console.aws.amazon.com/?nc2=h_m_mc) and login.
3. Select Elastic Beanstalk from the Compute section of the AWS console
4. Click Create New Application (top right corner)
5. Give application a name.
6. Create a new Web Sever Environment (can be either load balancing or single instance)
7. Select upload your own and choose zip file downloaded from repo (or select sample application for now and push project code later).
8. Click next for Environment Info, Additional Resources, and Configuration Details pages (no changes nessesary).
9. Set Environment variable keys(names) and values in Environment Tags page.
10. Click next on Permissions and Review Information pages (no changes nessesary).
11. Click the environment link (next to project name > environment name) to see the application front end.

## Testing
Use `npm test` to run tests and generate code coverage (coverage folder)
