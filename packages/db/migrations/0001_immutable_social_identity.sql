-- Primary wallet must belong to the same application user. Deferrable permits atomic identity creation.
ALTER TABLE users ADD CONSTRAINT selected_wallet_owner FOREIGN KEY (id, primary_wallet) REFERENCES wallets(user_id, address) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
CREATE FUNCTION fork_protect_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.address IS DISTINCT FROM NEW.address OR OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Wallet ownership is immutable';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER wallet_ownership_immutable BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION fork_protect_identity();
--> statement-breakpoint
CREATE FUNCTION fork_protect_metadata() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'finalized' AND (to_jsonb(OLD) - 'hidden' - 'updated_at') IS DISTINCT FROM (to_jsonb(NEW) - 'hidden' - 'updated_at') THEN
    RAISE EXCEPTION 'Finalized thesis content is immutable';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER finalized_metadata_immutable BEFORE UPDATE ON thesis_metadata FOR EACH ROW EXECUTE FUNCTION fork_protect_metadata();
--> statement-breakpoint
CREATE FUNCTION fork_protect_verified_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.verification_status = 'verified' AND (to_jsonb(OLD) - 'updated_at') IS DISTINCT FROM (to_jsonb(NEW) - 'updated_at') THEN
    RAISE EXCEPTION 'Verified execution evidence cannot be reassigned';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER verified_evidence_immutable BEFORE UPDATE ON execution_evidence FOR EACH ROW EXECUTE FUNCTION fork_protect_verified_evidence();
--> statement-breakpoint
CREATE FUNCTION fork_protect_comment_owner() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.author_user_id IS DISTINCT FROM NEW.author_user_id OR OLD.chain_id IS DISTINCT FROM NEW.chain_id OR OLD.registry_address IS DISTINCT FROM NEW.registry_address OR OLD.thesis_id IS DISTINCT FROM NEW.thesis_id THEN
    RAISE EXCEPTION 'Comment ownership and thesis are immutable';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER comment_ownership_immutable BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION fork_protect_comment_owner();
