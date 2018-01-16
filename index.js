const express = require('express');
var batch = require('batchflow');
var cron = require('cron');
var admin = require("firebase-admin");
var github = require('octonode');

const app = express();

var serviceAccount = require("./key-firebase.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://kittypad-d8e2d.firebaseio.com"
});

var db = admin.firestore();
var orgCol = db.collection('github').doc('organisations');
var repoCol = db.collection('github').doc('repos');
var userCol = db.collection('github').doc('users');

const GIT_ID = '1381d44f20246cbdba19';
const GIT_SECRET = 'a6d3cc5bed57502e606ce12fec4aebaf2b73e9f4';
var githubClient = github.client({
	id: GIT_ID,
	secret: GIT_SECRET
});

app.listen(3001,() => {
	fetchRepositoryCommits('ethereum/go-ethereum');
	//fetchOrganisationInfo('ethereum');
	/*
	fetchOrganisationInfo('ripple');
	fetchOrganisationInfo('bitcoincashorg');
	fetchOrganisationInfo('NemProject');
	fetchOrganisationInfo('litecoin-project');
	fetchOrganisationInfo('stellar');
	fetchOrganisationInfo('iotaledger');
	fetchOrganisationInfo('eosio');
	fetchOrganisationInfo('dashpay');
	fetchOrganisationInfo('neo-project');
	fetchOrganisationInfo('monero-project');*/
	//fetchOrganisationMembers('ethereum',1);
});

/*
 * @dev: Get the list of organisations we are watching from the database
 * Each organisation must have one github organisation 
 * profile with at least a single repo on githib
 * This list is fetched from the database
 */
getOrganisationList = () => {

}

/*
 * @dev: Fetch the organisation profile from github API and store it in the database
 * @parmas: 
 * - organisationId: String
 */
fetchOrganisationInfo = (organisationId) => {
	var ghorg = githubClient.org(organisationId).conditional('ETAG');
	return ghorg.info((err, data, headers)=>{
		if(!err && headers.status == '200 OK'){
			console.log('Processing', organisationId);
			createOrUpdateOrganisation(organisationId,data).then(()=>{
				console.log('Fetching repositories', organisationId);
				fetchOrganisationRepos(organisationId,1);
				console.log('Fetching members', organisationId);
				fetchOrganisationMembers(organisationId,1);
			})
		}
		else{
			console.log(err);
		}
	});
}

/*
 * @dev: Fetch the organisation list of 100 repos from github API and store it in the database
 * @parmas: 
 * - organisationId: String
 * - offset: Integer
 */
fetchOrganisationRepos = (organisationId,page) => {
	getOrganisation(organisationId).then((doc)=>{
		var ghorg = githubClient.org(doc.data().id).conditional('ETAG');
		ghorg.repos({
			page:page,
			per_page:100
		},(err, data, headers)=>{
			if(!err && headers.status == '200 OK'){
				data.forEach((repo)=>{
					createOrUpdateRepo(organisationId,repo);
				});
				if(data.length == 100){
					fetchOrganisationRepos(organisationId,page+1);
				}
			}
			else{
				console.log('Error fetching repo',err);
			}
		});
	})
}

/*
 * @dev: Fetch the organisation members from github API and store it in the database
 * @parmas: 
 * - organisationId: String
 */
fetchOrganisationMembers = (organisationId,page) => {
	var ghorg = githubClient.org(organisationId).conditional('ETAG');
	return ghorg.members({
		page:page,
		per_page:100
	},(err, data, headers)=>{
		if(!err && headers.status == '200 OK'){
			data.forEach((member)=>{
				if(member){
					fetchGithubUserInfo(member.login);
					createOrUpdateOrgMember(organisationId,member);
				}
			});
		}
	});
}

fetchGithubUserInfo = (userLogin) => {
	var ghuser = githubClient.user(userLogin).conditional('ETAG');
	return ghuser.info((err, data, headers)=>{
		if(!err && headers.status == '200 OK'){
			return createOrUpdateGitUser(data);
		}
	})
}

/*
 * @dev: Fetch a repository information from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryInfo = (repoId) => {

}

/*
 * @dev: Fetch a repository collaborators from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryCollaborators = (repoId) => {
	var ghrepo = githubClient.repo(repoId).collaborators((err, data, headers)=>{
		console.log(headers);
		if(!err && headers.status == '200 OK'){
			console.log(data);
		}
		else{
			console.log(err);
		}
	});	
}

/*
 * @dev: Fetch a repository commits from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryCommits = (repoId) => {
	var ghrepo = githubClient.repo(repoId).commits((err, data, headers)=>{
		console.log(headers);
		if(!err && headers.status == '200 OK'){
			console.log(data);
		}
		else{
			console.log(err);
		}
	});	
}

/*
 * @dev: Fetch a repository tags from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryTags = (repoId) => {

}

/*
 * @dev: Fetch a repository releases from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryReleases = (repoId) => {

}

/*
 * @dev: Fetch a repository languages from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryLanguages = (repoId) => {

}

/*
 * @dev: Fetch a repository contributors from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryContributors = (repoId) => {

}

/*
 * @dev: Fetch a repository branches from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryBranches = (repoId) => {

}

/*
 * @dev: Fetch a repository issues from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryIssues = (repoId) => {

}

/*
 * @dev: Fetch a repository milestones from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryMilestones = (repoId) => {

}

/*
 * @dev: Fetch a repository teams from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryTeams = (repoId) => {

}

/*
 * @dev: Fetch a repository starred by from github API and store it in the database
 * @parmas: 
 * - repoId: String
 */
fetchRepositoryStarredBy = (repoId) => {

}

/*
 * @dev: Fetch a given user informations from github API and store it in the database
 * @parmas: 
 * - userId: String
 */
fetchUserInformation = (userId) => {

}

/*
 * @dev: Fetch user followers from github API and store it in the database
 * @parmas: 
 * - userId: String
 */
fetchUserFollowers = (userId) => {

}

/*
 * @dev: Fetch ser following from github API and store it in the database
 * @parmas: 
 * - userId: String
 */
fetchUserFollowing = (userId) => {

}


/*
 * @dev: Fetch a user starred repo from github API and store it in the database
 * @parmas: 
 * - userId: String
 */
fetchUserStarredRepo = (userId) => {

}

/*
 * @dev: Fetch user teams from github API and store it in the database
 * @parmas: 
 * - userId: String
 */
fetchUserTeams = (userId) => {

}

createOrUpdateOrganisation = (organisationId,data) => {
	var org = { 
		id:organisationId,
		ghId: data.id,
		ghLogin: data.login,
		ghUrl: data.url,
		ghHasOrProjects: data.has_organization_projects,
		ghHasRepoProjects: data.has_repository_projects,
		ghReposCount: data.public_repos,
		ghHtml: data.html_url,
		ghCreatedAt: data.created_at,
		ghUpdatedAt: data.updated_at,
		ghType: data.type
	}

	addFieldDataIfValid(org,'ghAvatar',data.avatar_url);
	addFieldDataIfValid(org,'ghDescription',data.description);
	addFieldDataIfValid(org,'ghName',data.name);
	addFieldDataIfValid(org,'ghCompany',data.company);
	addFieldDataIfValid(org,'ghBlog',data.blog);

	return orgCol.collection(organisationId).doc('information').set(org);
}

getOrganisation = (organisationId) => {
	return orgCol.collection(organisationId).doc('information').get();
}

createOrUpdateRepo = (organisationId,data) =>{
	var repo = {
		id:data.id,
		name:data.name,
		fullName:data.full_name,
		isPrivate:data.private,
		htmlUrl: data.html_url,
		url: data.url,
		createdAt: data.created_at,
		updatedAt: data.updated_at,
		size: data.size,
		watchers: data.watchers_count,
		stars: data.stargazers_count,
		hasIssues: data.has_issues,
		hasProjects: data.has_projects,
		hasDownloads: data.has_downloads,
		hasWiki: data.has_wiki,
		hasPages: data.has_pages,
		forksCount: data.forks_count,
		archived: data.archived,
		openIssues: data.open_issues,
		permissions: data.permissions
	}
	addFieldDataIfValid(repo,'homepage',data.homepage);
	console.log('saving repo',repo);
	return repoCol.collection(organisationId).doc(repo.name).set(repo);
}

createOrUpdateOrgMember = (organisationId,data) => {
	var member = {
		id:data.id,
		login:data.login,
		avatar:data.avatar_url
	}
	return orgCol.collection(organisationId).doc('members').collection('list').doc(member.id.toString()).set(member);
}

createOrUpdateGitUser = (data) => {
	var user = {
		id:data.id,
		login:data.login,
		avatar:data.avatar_url,
		reposCount:data.public_repos,
		gistsCount:data.public_gists,
		followers:data.followers,
		following:data.following,
		createdAt: data.created_at,
		updatedAt: data.updated_at
	}
	addFieldDataIfValid(user,'name',data.name);
	addFieldDataIfValid(user,'company',data.company);
	addFieldDataIfValid(user,'blog',data.blog);
	addFieldDataIfValid(user,'location',data.location);
	addFieldDataIfValid(user,'email',data.email);
	addFieldDataIfValid(user,'hireable',data.hireable);
	addFieldDataIfValid(user,'bio',data.bio);
	console.log(user);
	return userCol.collection('list').doc(data.id.toString()).set(user);
}

/*
 * @dev: Helper function that make sure a value is not null and not empty before adding it to the object
 * @parmas: 
 * - obj: Object
 * - key: String
 * - value: string
 */
addFieldDataIfValid = (obj,key,value) => {
	if(value && value != ''){
		obj[key] = value;
	}
}

