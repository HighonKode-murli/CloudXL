import Team from '../models/Team.js'


export const requireAdmin = async(req,res,next)=>{
    if(req.user.role!='admin'){
        return res.status(403).json({error : 'Admin access required!'})
    }
    next()
}

export const requireTeamAdmin = async(req,res,next)=>{
    const team = await Team.findById(req.params.teamId)
    if(!team || team.adminId.toString() != req.user._id.toString()){
        return res.status(403).json({error : 'Team admin access required!'})
    }
    req.team = team
    next()
}