import express from 'express'
import crypto from 'crypto'
import requireAuth from '../middleware/auth.js'
import {requireAdmin , requireTeamAdmin} from '../middleware/teamAuth.js'
import Team from '../models/Team.js'
import TeamMember from '../models/TeamMember.js'
import TeamInvitation from '../models/TeamInvitation.js'
import { sendMail } from '../utils/mailer.js'
import { inviteEmailTemplate } from '../utils/templates/inviteEmail.js'

const router = express.Router()


//create team (admin only)
router.post('/',requireAuth,requireAdmin, async(req,res)=>{
    const {name, profiles} = req.body
    const team = await Team.create({
        name,
        adminId : req.user._id,
        profiles : profiles || ['editors','content-writers','tech-devs','cross-section']
    })
    res.json(team)
})

// get user's team
router.get('/my-teams',requireAuth,async(req,res)=>{
    const memberships = await TeamMember.find({userId : req.user._id}).populate('teamId')
    const adminTeams = await Team.find({adminId : req.user._id})

    res.json({memberOf : memberships, adminOf:adminTeams})
})

//invite user to team
router.post('/:teamId/invite', requireAuth, requireTeamAdmin, async(req,res)=>{
    try {
        const {email,profile} = req.body
        const inviteToken = crypto.randomUUID()

        // Get team details for email
        const team = await Team.findById(req.params.teamId)
        if (!team) {
            return res.status(404).json({ error: 'Team not found' })
        }

        // Create invitation
        await TeamInvitation.create({
            teamId : req.params.teamId,
            email,
            profile,
            inviteToken,
            expiresAt : new Date(Date.now() + 7*24*60*60*1000) //7days
        })

        // Build invite link
        const inviteLink = `${process.env.FRONTEND_URL}/teams/join?token=${inviteToken}`
        
        // Get inviter email
        const inviterEmail = req.user.email

        // Compose and send email
        const { subject, text, html } = inviteEmailTemplate({
            teamName: team.name,
            profile,
            inviteLink,
            inviterEmail
        })

        let emailSent = false
        try {
            await sendMail({ to: email, subject, text, html })
            emailSent = true
        } catch (err) {
            console.error('Invite email send failed:', err)
        }

        // Respond with link and status
        res.json({
            message: 'Invitation created',
            inviteLink,
            emailSent
        })
    } catch (error) {
        console.error('Invite error:', error)
        res.status(500).json({ error: 'Failed to create invitation' })
    }
})

// Get pending invitations for current user
router.get('/invitations/pending', requireAuth, async (req, res, next) => {
  try {
    console.log('Fetching invitations for user:', req.user.email)
    const invitations = await TeamInvitation.find({
      email: req.user.email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('teamId', 'name')
    
    console.log('Found invitations:', invitations.length)
    res.json({ invitations })
  } catch (error) {
    console.error('Get pending invitations error:', error)
    next(error)
  }
})

// Accept invitation
router.post('/invitations/:invitationId/accept', requireAuth, async (req, res, next) => {
  try {
    const invitation = await TeamInvitation.findOne({
      _id: req.params.invitationId,
      email: req.user.email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or expired invitation' })
    }

    // Check if already a member
    const existingMember = await TeamMember.findOne({
      teamId: invitation.teamId,
      userId: req.user._id
    })

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this team' })
    }

    await TeamMember.create({
      teamId: invitation.teamId,
      userId: req.user._id,
      profile: invitation.profile
    })

    invitation.status = 'accepted'
    await invitation.save()

    res.json({ message: 'Invitation accepted successfully' })
  } catch (error) {
    console.error('Accept invitation error:', error)
    next(error)
  }
})

// Reject invitation
router.post('/invitations/:invitationId/reject', requireAuth, async (req, res, next) => {
  try {
    const invitation = await TeamInvitation.findOne({
      _id: req.params.invitationId,
      email: req.user.email,
      status: 'pending'
    })

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    invitation.status = 'rejected'
    await invitation.save()

    res.json({ message: 'Invitation rejected' })
  } catch (error) {
    console.error('Reject invitation error:', error)
    next(error)
  }
})

//join a team (via link)
router.post('/join/:token',requireAuth,async(req,res)=>{
    const invitation = await TeamInvitation.findOne({
        inviteToken : req.params.token,
        status : 'pending',
        expiresAt : {$gt : new Date()}
    })

    if(!invitation) return res.status(404).json({error : 'Invalid or expired invitation'})

    // Check if already a member
    const existingMember = await TeamMember.findOne({
      teamId: invitation.teamId,
      userId: req.user._id
    })

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this team' })
    }

    await TeamMember.create({
        teamId : invitation.teamId,
        userId : req.user._id,
        profile : invitation.profile
    })

    invitation.status = 'accepted'
    await invitation.save()

    res.json({message : 'Joined team successfully'})
})

// Get team members
router.get('/:teamId/members', requireAuth, requireTeamAdmin, async (req, res, next) => {
  try {
    const members = await TeamMember.find({ teamId: req.params.teamId })
      .populate('userId', 'email')
      .sort({ joinedAt: -1 });
    
    const memberList = members.map(m => ({
      _id: m._id,
      userId: m.userId._id,
      email: m.userId.email,
      profile: m.profile,
      joinedAt: m.joinedAt
    }));
    
    res.json({ 
      members: memberList,
      totalMembers: memberList.length 
    });
  } catch (error) {
    console.error('Get team members error:', error);
    next(error);
  }
});

// Remove team member
router.delete('/:teamId/members/:userId', requireAuth, requireTeamAdmin, async (req, res, next) => {
  try {
    const { teamId, userId } = req.params;
    
    // Prevent admin from removing themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Team admin cannot remove themselves' });
    }
    
    const deleted = await TeamMember.findOneAndDelete({ 
      teamId, 
      userId 
    });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    res.json({ 
      message: 'Team member removed successfully',
      removedMember: {
        userId: deleted.userId,
        profile: deleted.profile
      }
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    next(error);
  }
});


export default router